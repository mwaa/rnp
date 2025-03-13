use anchor_lang::prelude::*;

declare_id!("2xm1TFEVP9VVFyLEuSTf2BgkXDaAv6obu5GR1cBmj7xt");

#[program]
pub mod rnp {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
