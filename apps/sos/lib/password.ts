// One password policy for every form that sets or checks a password: sign-in, invite, reset,
// adding a person, changing your own (SOS-007: invite and reset accepted 6 characters while sign-in
// required 8, so such a password could never be used to sign in).
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 50;
