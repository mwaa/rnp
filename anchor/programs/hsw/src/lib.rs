use anchor_lang::prelude::*;

declare_id!("FREdSFWyTgXXXXw2tsVZX9gv1HBGE1MLELVUDKbpGkm4");

#[program]
pub mod hsw {
    use super::*;

    pub fn join_sonic_world(ctx: Context<Initialize>) -> Result<()> {
        let greeting_account = &mut ctx.accounts.greeting_account;
        greeting_account.counter = 0;
        greeting_account.user = ctx.accounts.user.key();
        greeting_account.bump = greeting_account.bump;
        Ok(())
    }

    pub fn send_a_message(ctx: Context<IncrementGreeting>) -> Result<()> {
        msg!("Hello, Sonic World!");

        let greeting_account = &mut ctx.accounts.greeting_account;
        greeting_account.counter += 1;

        msg!("Greeted {} time(s)!", greeting_account.counter);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 4 + 32 + 1,
        seeds = [b"greeting".as_ref(), user.key().as_ref()],
        bump
    )]
    pub greeting_account: Account<'info, GreetingAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct IncrementGreeting<'info> {
    #[account(
        mut, 
        has_one = user,
        seeds = [b"greeting".as_ref(), user.key().as_ref()],
        bump,
    )]
    pub greeting_account: Account<'info, GreetingAccount>,
    pub user: Signer<'info>,
}

#[account]
pub struct GreetingAccount {
    pub counter: u32,
    pub user: Pubkey,
    pub bump: u8,
}