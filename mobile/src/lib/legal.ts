/**
 * Terms of use and privacy notice shown in the app.
 * Written for the current stage: a free, pre-release project that is not on the
 * App Store and takes no payments. Revisit both before any public launch.
 */
export interface LegalSection {
  heading: string;
  paragraphs: string[];
}
export interface LegalDoc {
  title: string;
  updated: string;
  sections: LegalSection[];
}

export const terms: LegalDoc = {
  title: 'Terms of use',
  updated: '29 October 2026',
  sections: [
    {
      heading: 'What PLXYGROUND is',
      paragraphs: [
        'PLXYGROUND connects sports creators with brands. Creators share posts and apply to opportunities; brands post opportunities and review applicants.',
        'The app is a free, pre-release project. Features may change or stop working, and there is no guarantee of availability.',
      ],
    },
    {
      heading: 'Your account',
      paragraphs: [
        'You must be at least 16 to use PLXYGROUND. Give accurate details and keep your password to yourself; you are responsible for what happens on your account.',
        'You can delete your account at any time from Profile → Delete account.',
      ],
    },
    {
      heading: 'What you post',
      paragraphs: [
        'You keep ownership of what you post. By posting, you let PLXYGROUND show it inside the app.',
        'Only post things you have the right to share. No harassment, hate, sexual content, scams, spam, impersonation or anything illegal.',
        'Every post is reviewed before it appears in the feed, and moderators can remove anything that breaks these rules.',
      ],
    },
    {
      heading: 'Deals between creators and brands',
      paragraphs: [
        'PLXYGROUND helps creators and brands find each other. Any agreement, payment or work you arrange is between you and the other person; PLXYGROUND is not a party to it and does not handle payments.',
        'Be careful with anyone who asks for money up front or for your passwords. Report it using the Report option.',
      ],
    },
    {
      heading: 'Reporting, blocking and enforcement',
      paragraphs: [
        'You can report posts, opportunities, messages and accounts, and block anyone so they cannot message you and you no longer see their posts.',
        'Accounts that break these rules can be suspended or removed.',
      ],
    },
    {
      heading: 'Changes',
      paragraphs: ['These terms may be updated as the app develops. The date at the top shows the latest version.'],
    },
  ],
};

export const privacy: LegalDoc = {
  title: 'Privacy notice',
  updated: '29 October 2026',
  sections: [
    {
      heading: 'What we collect',
      paragraphs: [
        'Account details: your email address and a securely hashed version of your password (we never store the password itself).',
        'Profile: your name, bio, sport or industry, location, website and profile photo or logo, if you add them.',
        'Activity: your posts and photos, the opportunities you post or apply to, your messages, notifications, and any reports or blocks you make.',
        'Basic server logs, such as IP addresses and request times, used to keep the service secure.',
      ],
    },
    {
      heading: 'What we do not do',
      paragraphs: [
        'No ads, no selling or sharing your data with advertisers, and no third-party tracking or analytics in the app.',
      ],
    },
    {
      heading: 'Who sees what',
      paragraphs: [
        'Your profile, approved posts and opportunities are visible to other signed-in users. Messages are only visible to the two people in the conversation, and to moderators if a message is reported.',
        'Brands see the message and profile you send with an application.',
      ],
    },
    {
      heading: 'Where it is stored',
      paragraphs: [
        'The app runs on Vercel (hosting and photo storage) and Neon (database). They store the data on our behalf and do not use it for their own purposes.',
        'On your phone, your sign-in token is kept in the iOS Keychain.',
      ],
    },
    {
      heading: 'How long we keep it',
      paragraphs: [
        'We keep your data while your account exists. When you delete your account, your profile, posts, photos, listings, applications, conversations, notifications, blocks and the reports you filed are permanently deleted.',
        'Two things are kept: a security log entry recording that the account was deleted (no profile details), and reports other people filed about you, so moderators keep a record.',
      ],
    },
    {
      heading: 'Your rights',
      paragraphs: [
        'Under UK data protection law (UK GDPR) you can ask to see, correct or delete your data. You can edit your profile and delete your account yourself in the app.',
        'You can also complain to the Information Commissioner’s Office (ico.org.uk).',
      ],
    },
  ],
};

export const legalDocs = { terms, privacy } as const;
export type LegalDocKey = keyof typeof legalDocs;
