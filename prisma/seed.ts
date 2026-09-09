// Demo data seeded from Jamie's real "Movie Rankings Season 2" spreadsheet,
// so the app has something fun in it the first time you run it.
// Re-run any time with `npm run db:seed` — it clears the demo group first.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_SLUG = "movie-night-trackers-demo";
const DEMO_PASSWORD = "movienight1"; // same for every demo account, see README

type RatingInput = {
  member: string;
  score: number;
  rewatch: boolean;
  fav?: string;
  least?: string;
  fellAsleep?: boolean;
  quote?: string;
};

type MovieInput = {
  title: string;
  watchedOn: string;
  runtimeMin: number;
  imdbRating: number;
  pickedBy: string;
  delayedMin?: number;
  bechdel?: boolean;
  vibe?: string;
  vehicleCrash?: boolean;
  corvCameo?: boolean;
  anikinTiktok?: boolean;
  muted?: string;
  ratings: RatingInput[];
};

const MOVIES: MovieInput[] = [
  {
    title: "No Other Choice",
    watchedOn: "2026-01-04",
    runtimeMin: 139,
    imdbRating: 7.5,
    pickedBy: "Corvus",
    delayedMin: 79,
    bechdel: false,
    vibe: "None",
    vehicleCrash: false,
    corvCameo: false,
    anikinTiktok: true,
    muted: "Corv, Anikin",
    ratings: [
      { member: "Leo", score: 6.8, rewatch: true, fav: "Man-Soo", least: "Bummo", fellAsleep: true },
      { member: "Jamie", score: 7, rewatch: false, fav: "Man-Soo", least: "Bummo" },
      {
        member: "Bella",
        score: 5.8,
        rewatch: false,
        fav: "Ri-One",
        least: "Last guy that got murdered",
      },
      { member: "Anikin", score: 5, rewatch: true, fav: "N/A", least: "N/A" },
      { member: "Corvus", score: 7.5, rewatch: true, fav: "Ara", least: "Man-Soo" },
    ],
  },
  {
    title: "The Simpsons Movie",
    watchedOn: "2026-01-08",
    runtimeMin: 86,
    imdbRating: 7.3,
    pickedBy: "Bella",
    delayedMin: 78,
    bechdel: false,
    vibe: "Yaoi",
    vehicleCrash: true,
    corvCameo: false,
    anikinTiktok: false,
    muted: "",
    ratings: [
      { member: "Leo", score: 9, rewatch: true, fav: "Homer", least: "Colin" },
      { member: "Jamie", score: 9.3, rewatch: true, fav: "Homer", least: "Russ" },
      { member: "Bella", score: 9, rewatch: true, fav: "Marge", least: "Russ" },
      {
        member: "Anikin",
        score: 7,
        rewatch: true,
        fav: "Marge",
        least: "Colin",
        fellAsleep: true,
      },
      {
        member: "Corvus",
        score: 8,
        rewatch: true,
        fav: "Homer",
        least: "Russ",
        quote: "Thank you boob lady",
      },
    ],
  },
  {
    title: "Bugonia",
    watchedOn: "2026-01-11",
    runtimeMin: 114,
    imdbRating: 7.5,
    pickedBy: "Jamie",
    delayedMin: 88,
    bechdel: true,
    vibe: "None",
    vehicleCrash: false,
    corvCameo: false,
    anikinTiktok: false,
    ratings: [
      { member: "Leo", score: 8, rewatch: true, fav: "Michelle", least: "Casey" },
      { member: "Jamie", score: 9.5, rewatch: true, fav: "Michelle", least: "Casey", quote: "Yay! :D" },
      { member: "Bella", score: 9.2, rewatch: true, fav: "Michelle", least: "Casey" },
      { member: "Anikin", score: 9, rewatch: true, fav: "Michelle", least: "Casey" },
      { member: "Corvus", score: 9, rewatch: true, fav: "Michelle", least: "Casey" },
    ],
  },
  {
    title: "Dancer in the Dark",
    watchedOn: "2026-01-22",
    runtimeMin: 140,
    imdbRating: 7.9,
    pickedBy: "Corvus",
    delayedMin: 54,
    bechdel: true,
    vibe: "None",
    vehicleCrash: false,
    corvCameo: false,
    anikinTiktok: true,
    ratings: [
      { member: "Leo", score: 6.9, rewatch: true, fav: "Kathy", least: "Jeff", quote: "I have red key" },
      { member: "Jamie", score: 7, rewatch: false, fav: "Selma", least: "Bill" },
      { member: "Bella", score: 8.6, rewatch: false, fav: "Selma", least: "Bill" },
      { member: "Anikin", score: 4, rewatch: false, fav: "Serving Guard", least: "Bill" },
      { member: "Corvus", score: 9, rewatch: false, fav: "Selma", least: "Bill" },
    ],
  },
  {
    title: "The Last Five Years",
    watchedOn: "2026-05-07",
    runtimeMin: 91,
    imdbRating: 5.3,
    pickedBy: "Jamie",
    bechdel: false,
    vibe: "None",
    vehicleCrash: false,
    corvCameo: false,
    anikinTiktok: false,
    ratings: [
      { member: "Leo", score: 2, rewatch: false, fav: "Cathy", least: "Jamie", quote: "Ohio" },
      { member: "Jamie", score: 2, rewatch: false, fav: "Cathy", least: "Jamie" },
      { member: "Bella", score: 0, rewatch: false, fav: "Cathy", least: "Jamie" },
      { member: "Anikin", score: 1, rewatch: false, fav: "Cathy", least: "Jamie" },
      { member: "Corvus", score: 0.5, rewatch: false, fav: "Cathy", least: "Jamie" },
    ],
  },
  {
    title: "Mortal Kombat",
    watchedOn: "2026-05-14",
    runtimeMin: 100,
    imdbRating: 6.8,
    pickedBy: "Leo",
    bechdel: false,
    vibe: "None",
    vehicleCrash: true,
    corvCameo: false,
    anikinTiktok: false,
    ratings: [
      { member: "Leo", score: 1, rewatch: false, fav: "Kabal", least: "Cole", quote: "You Fat Pig" },
      { member: "Jamie", score: 1, rewatch: false, fav: "Liu Kang", least: "Cole" },
      { member: "Bella", score: 2.5, rewatch: false, fav: "Sonya", least: "Kano" },
      {
        member: "Anikin",
        score: 0,
        rewatch: false,
        fav: "Sonya",
        least: "Kano",
        fellAsleep: true,
      },
      { member: "Corvus", score: 0, rewatch: false, fav: "N/A", least: "Kano" },
    ],
  },
  {
    title: "The Grand Budapest Hotel",
    watchedOn: "2026-06-22",
    runtimeMin: 98,
    imdbRating: 8.1,
    pickedBy: "Leo",
    delayedMin: 125,
    bechdel: false,
    vibe: "None",
    vehicleCrash: true,
    corvCameo: false,
    anikinTiktok: true,
    ratings: [
      {
        member: "Leo",
        score: 10,
        rewatch: true,
        fav: "Zero",
        least: "Dmitri",
        quote: "We think you're a straight fella - I've never been accused of that before",
      },
      { member: "Jamie", score: 8, rewatch: true, fav: "Gustave", least: "Serge X" },
      { member: "Bella", score: 7.2, rewatch: true, fav: "Agatha", least: "Dmitri" },
      { member: "Anikin", score: 5, rewatch: true, fav: "Agatha", least: "Serge X" },
      { member: "Corvus", score: 8, rewatch: false, fav: "Agatha", least: "Serge X" },
    ],
  },
  {
    title: "Bridesmaids",
    watchedOn: "2026-05-10",
    runtimeMin: 125,
    imdbRating: 6.8,
    pickedBy: "Anikin",
    bechdel: true,
    vibe: "Yuri",
    vehicleCrash: true,
    corvCameo: false,
    anikinTiktok: false,
    muted: "Corv",
    ratings: [
      { member: "Leo", score: 7, rewatch: true, fav: "Megan", least: "Ted" },
      { member: "Jamie", score: 9.5, rewatch: true, fav: "Megan", least: "Ted" },
      { member: "Bella", score: 8.3, rewatch: true, fav: "Annie", least: "Ted" },
      { member: "Anikin", score: 10, rewatch: true, fav: "Annie", least: "Ted" },
      { member: "Corvus", score: 9, rewatch: true, fav: "Annie", least: "Ted" },
    ],
  },
];

const memberDefs = [
  { name: "Corvus", email: "corvus@example.com", emoji: "🦉", color: "#6366f1", role: "MEMBER" as const },
  { name: "Leo", email: "leo@example.com", emoji: "🦁", color: "#f97316", role: "MEMBER" as const },
  { name: "Bella", email: "bella@example.com", emoji: "🦋", color: "#ec4899", role: "MEMBER" as const },
  { name: "Jamie", email: "jamie@example.com", emoji: "🦊", color: "#22c55e", role: "OWNER" as const },
  { name: "Anikin", email: "anikin@example.com", emoji: "🐢", color: "#06b6d4", role: "MEMBER" as const },
];

async function main() {
  // Clean slate on re-seed: the group cascades to its members/movies, but
  // the demo Users live independently, so clear those out too.
  await prisma.group.deleteMany({ where: { slug: DEMO_SLUG } });
  await prisma.user.deleteMany({ where: { email: { in: memberDefs.map((m) => m.email) } } });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const users: Record<string, { id: string }> = {};
  for (const md of memberDefs) {
    users[md.name] = await prisma.user.create({
      data: { name: md.name, email: md.email, passwordHash },
    });
  }

  const owner = memberDefs.find((m) => m.role === "OWNER")!;

  const group = await prisma.group.create({
    data: {
      name: "Movie Night Trackers",
      slug: DEMO_SLUG,
      tagline: "Est. one bad decision at a time",
      ownerId: users[owner.name].id,
    },
  });

  const members: Record<string, { id: string }> = {};
  for (const md of memberDefs) {
    const member = await prisma.member.create({
      data: {
        groupId: group.id,
        userId: users[md.name].id,
        role: md.role,
        emoji: md.emoji,
        color: md.color,
      },
    });
    members[md.name] = member;
  }

  const customFieldDefs: {
    label: string;
    emoji: string;
    type: "BOOLEAN" | "TEXT" | "NUMBER" | "SELECT";
    scope: "MOVIE" | "RATING";
    options?: string;
  }[] = [
    { label: "Bechdel Test", emoji: "🎬", type: "BOOLEAN", scope: "MOVIE" },
    { label: "Yuri/Yaoi Vibes", emoji: "💞", type: "SELECT", scope: "MOVIE", options: "None,Yuri,Yaoi" },
    { label: "Vehicle Crash", emoji: "🚗", type: "BOOLEAN", scope: "MOVIE" },
    { label: "Corv Cameo", emoji: "🦉", type: "BOOLEAN", scope: "MOVIE" },
    { label: "Anikin Caught on TikTok", emoji: "📱", type: "BOOLEAN", scope: "MOVIE" },
    { label: "Muted But Didn't Realize", emoji: "🔇", type: "TEXT", scope: "MOVIE" },
    { label: "Minutes Late Starting", emoji: "⏰", type: "NUMBER", scope: "MOVIE" },
  ];

  const fields: Record<string, { id: string }> = {};
  let order = 0;
  for (const fd of customFieldDefs) {
    const field = await prisma.customField.create({
      data: {
        groupId: group.id,
        label: fd.label,
        emoji: fd.emoji,
        type: fd.type,
        scope: fd.scope,
        options: fd.options ?? null,
        order: order++,
      },
    });
    fields[fd.label] = field;
  }

  for (const md of MOVIES) {
    const movie = await prisma.movie.create({
      data: {
        groupId: group.id,
        title: md.title,
        watchedOn: new Date(md.watchedOn),
        runtimeMin: md.runtimeMin,
        imdbRating: md.imdbRating,
        pickedById: members[md.pickedBy]?.id ?? null,
      },
    });

    const movieFieldValues: [string, string | undefined][] = [
      ["Bechdel Test", md.bechdel !== undefined ? String(md.bechdel) : undefined],
      ["Yuri/Yaoi Vibes", md.vibe],
      ["Vehicle Crash", md.vehicleCrash !== undefined ? String(md.vehicleCrash) : undefined],
      ["Corv Cameo", md.corvCameo !== undefined ? String(md.corvCameo) : undefined],
      [
        "Anikin Caught on TikTok",
        md.anikinTiktok !== undefined ? String(md.anikinTiktok) : undefined,
      ],
      ["Muted But Didn't Realize", md.muted],
      ["Minutes Late Starting", md.delayedMin !== undefined ? String(md.delayedMin) : undefined],
    ];

    for (const [label, value] of movieFieldValues) {
      if (!value) continue;
      const field = fields[label];
      if (!field) continue;
      await prisma.customFieldValue.create({
        data: { fieldId: field.id, movieId: movie.id, value },
      });
    }

    for (const r of md.ratings) {
      const member = members[r.member];
      if (!member) continue;
      await prisma.rating.create({
        data: {
          movieId: movie.id,
          memberId: member.id,
          score: r.score,
          rewatch: r.rewatch,
          favoriteChar: r.fav ?? null,
          leastFavChar: r.least ?? null,
          fellAsleep: r.fellAsleep ?? false,
          quote: r.quote ?? null,
        },
      });
    }
  }

  console.log(`✅ Seeded "${group.name}" with ${MOVIES.length} movie nights.`);
  console.log(`   Open http://localhost:3000/login and sign in as any of:`);
  for (const md of memberDefs) {
    console.log(`     ${md.email}  (password: ${DEMO_PASSWORD})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
