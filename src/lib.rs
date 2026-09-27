#![no_std]

#[cfg(target_arch = "wasm32")]
#[panic_handler]
fn panic(_: &core::panic::PanicInfo) -> ! { loop {} }

pub const CITIES: [&str; 9] = ["Amsterdam", "Bangkok", "Gdynia", "Hong Kong", "London", "Munich", "New York", "Rome", "Tokyo"];
pub const GOODS: [&str; 10] = ["Kawa", "Herbata", "Tyton", "Zboze", "Ropa", "Elektronika", "Maszyny", "Komputery", "Samochody", "Zloto"];
pub const BASE: [i32; 10] = [18, 14, 22, 9, 31, 75, 110, 160, 350, 240];
pub const STOCKS: [&str; 10] = ["HILTON", "INTERNATIONAL", "MCDONALDS", "PHILIPS", "JVC", "TOYOTA", "PKOBP", "ORLEN", "HIPROMINE", "EXCELLENCE"];

#[derive(Clone, Copy)]
pub struct State { pub cash: i32, pub bank: i32, pub debt: i32, pub city: u8, pub day: u16, pub cargo: [u16; 10], pub shares: [u16; 10], pub prices: [i32; 10], pub rng: u32 }

impl State {
    pub const fn new(seed: u32) -> Self { Self { cash: 1000, bank: 0, debt: 25000, city: 0, day: 1, cargo: [0;10], shares: [0;10], prices: BASE, rng: if seed == 0 { 1 } else { seed } } }
    fn random(&mut self, n: u32) -> u32 { self.rng ^= self.rng << 13; self.rng ^= self.rng >> 17; self.rng ^= self.rng << 5; self.rng % n }
    pub fn used(&self) -> u32 { self.cargo.iter().map(|&q|q as u32).sum() }
    pub fn total_cash(&self) -> i32 { self.cash + self.bank }
    pub fn buy(&mut self, good: usize, qty: u16) -> bool {
        if good >= 10 || qty == 0 || self.cargo[good] as u32 + qty as u32 > u16::MAX as u32 { return false; }
        let cost = self.prices[good] as i64 * qty as i64;
        if cost > self.cash as i64 { return false; }
        self.cash -= cost as i32; self.cargo[good] += qty; true
    }
    pub fn sell(&mut self, good: usize, qty: u16) -> bool {
        if good >= 10 || qty == 0 || self.cargo[good] < qty { return false; }
        let cash = self.cash as i64 + self.prices[good] as i64 * qty as i64;
        if cash > i32::MAX as i64 { return false; }
        self.cargo[good] -= qty; self.cash = cash as i32; true
    }
    pub fn bank_deposit(&mut self, amount: i32) -> bool { if amount <= 0 || self.cash < amount { return false; } self.cash-=amount; self.bank+=amount; true }
    pub fn bank_withdraw(&mut self, amount: i32) -> bool { if amount <= 0 || self.bank < amount { return false; } self.bank-=amount; self.cash+=amount; true }
    pub fn borrow(&mut self, amount: i32) -> bool { if amount <= 0 || amount > 5000 { return false; } self.cash+=amount; self.debt+=amount; true }
    pub fn repay(&mut self, amount: i32) -> bool { if amount <= 0 || self.cash < amount || self.debt < amount { return false; } self.cash-=amount; self.debt-=amount; true }
    pub fn travel(&mut self, city: u8) -> Option<u8> { if city >= 9 || city == self.city { return None; } self.city=city; self.day+=1; self.debt=self.debt+self.debt/100; for i in 0..10 { let swing=self.random(31) as i32; self.prices[i]=(self.prices[i]*(85+swing)/100).max(1); } if self.random(100)<25 { Some(self.random(12) as u8) } else { None } }
    pub fn stock(&mut self, index: usize, qty: u16, buy: bool) -> bool { if index>=10 { return false; } let price=(80+((self.day as i32*17+index as i32*31)%90)).max(1); if buy { if self.shares[index] as u32+qty as u32>65535 || self.cash<price*qty as i32{return false} self.cash-=price*qty as i32; self.shares[index]+=qty; } else {if self.shares[index]<qty{return false} self.shares[index]-=qty; self.cash+=price*qty as i32;} true }
}

struct Global(core::cell::UnsafeCell<State>);
unsafe impl Sync for Global {}
static STATE: Global = Global(core::cell::UnsafeCell::new(State::new(1)));
unsafe fn state() -> &'static mut State { &mut *STATE.0.get() }

#[no_mangle]
pub extern "C" fn core_init(seed: u32) { unsafe { *state() = State::new(seed); } }
#[no_mangle]
pub extern "C" fn core_get(field: u32, index: u32) -> i32 { unsafe { let s=state(); match field { 0 => s.cash, 1 => s.bank, 2 => s.debt, 3 => s.city as i32, 4 => s.day as i32, 5 => s.used() as i32, 6 => s.prices.get(index as usize).copied().unwrap_or(0), 7 => s.cargo.get(index as usize).copied().unwrap_or(0) as i32, 8 => s.shares.get(index as usize).copied().unwrap_or(0) as i32, 9 => s.rng as i32, _ => 0 } } }
#[no_mangle]
pub extern "C" fn core_set(field: u32, index: u32, value: i32) { unsafe { let s=state(); if value < 0 && field != 9 { return; } match field { 0 => s.cash=value, 1 => s.bank=value, 2 => s.debt=value, 3 if value < 9 => s.city=value as u8, 4 => s.day=value as u16, 6 if (index as usize)<10 => s.prices[index as usize]=value.max(1), 7 if (index as usize)<10 => s.cargo[index as usize]=value as u16, 8 if (index as usize)<10 => s.shares[index as usize]=value as u16, 9 => s.rng=value as u32, _=>{} } } }
#[no_mangle]
pub extern "C" fn core_buy(good:u32, qty:u32)->i32 { unsafe { if good>=10 || qty>u16::MAX as u32 {return 0} state().buy(good as usize,qty as u16) as i32 } }
#[no_mangle]
pub extern "C" fn core_sell(good:u32, qty:u32)->i32 { unsafe { if good>=10 || qty>u16::MAX as u32 {return 0} state().sell(good as usize,qty as u16) as i32 } }
#[no_mangle]
pub extern "C" fn core_bank(operation:u32, amount:i32)->i32 { unsafe { let s=state(); (match operation { 0=>s.bank_deposit(amount), 1=>s.bank_withdraw(amount), 2=>s.repay(amount), 3=>s.borrow(amount), _=>false }) as i32 } }
#[no_mangle]
pub extern "C" fn core_stock(index:u32, qty:u32, buy:i32)->i32 { unsafe { if qty>u16::MAX as u32{return 0} state().stock(index as usize,qty as u16,buy!=0) as i32 } }
#[no_mangle]
pub extern "C" fn core_travel(city:u32)->i32 { unsafe { let s=state(); if city>=9 || city as u8==s.city{return -2} s.travel(city as u8).map(i32::from).unwrap_or(-1) } }

#[cfg(test)]
mod tests { use super::*; #[test] fn trade_and_funds(){let mut s=State::new(42);assert!(s.buy(0,10));assert_eq!(s.used(),10);assert!(s.sell(0,4));assert_eq!(s.cargo[0],6);assert!(!s.buy(0,101));} #[test] fn bank_and_debt(){let mut s=State::new(1);assert!(s.bank_deposit(100));assert!(s.borrow(50));assert!(s.repay(50));assert!(s.bank_withdraw(100));assert_eq!(s.debt,25000);} #[test] fn travel_is_free_and_advances(){let mut s=State::new(99);let cash=s.cash;assert_eq!(s.travel(1),None);assert_eq!(s.cash,cash);assert_eq!(s.day,2);assert_eq!(s.debt,25250);} }

#[no_mangle]
pub extern "C" fn core_version() -> u32 { 4 }
