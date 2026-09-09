import { average } from "./utils";

// These are deliberately plain, hand-shaped types (not the Prisma-generated
// ones) — pages map their query results into this shape before calling in
// here, which keeps the stats math decoupled from exact Prisma types.

export interface RatingLite {
  memberId: string;
  memberName: string;
  score: number;
  rewatch: boolean | null;
  fellAsleep: boolean | null;
}

export interface MovieLite {
  id: string;
  title: string;
  watchedOn: string; // ISO date string
  pickedById: string | null;
  pickedByName: string | null;
  imdbRating: number | null;
  runtimeMin: number | null;
  ratings: RatingLite[];
}

export interface MemberLite {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface MemberStat extends MemberLite {
  moviesRated: number;
  avgGiven: number | null;
  timesRewatch: number;
  timesAsleep: number;
  moviesPicked: number;
  avgReceivedForPicks: number | null;
}

export interface Superlative {
  title: string;
  emoji: string;
  member?: MemberStat;
  movie?: MovieLite & { avgScore: number | null };
  detail: string;
}

export interface GroupStats {
  totalMovies: number;
  totalRatings: number;
  avgRuntime: number | null;
  avgGroupScore: number | null;
  highestRatedMovie: (MovieLite & { avgScore: number }) | null;
  lowestRatedMovie: (MovieLite & { avgScore: number }) | null;
  biggestDisagreementMovie: (MovieLite & { avgScore: number; spread: number }) | null;
  members: MemberStat[];
  superlatives: Superlative[];
}

export function movieAvg(movie: MovieLite): number | null {
  return average(movie.ratings.map((r) => r.score));
}

export function computeGroupStats(movies: MovieLite[], members: MemberLite[]): GroupStats {
  const withAvg = movies
    .map((m) => ({ ...m, avgScore: movieAvg(m) }))
    .filter((m): m is MovieLite & { avgScore: number } => m.avgScore !== null);

  const totalRatings = movies.reduce((sum, m) => sum + m.ratings.length, 0);

  const runtimes = movies.map((m) => m.runtimeMin).filter((n): n is number => !!n);

  let highestRatedMovie: (MovieLite & { avgScore: number }) | null = null;
  let lowestRatedMovie: (MovieLite & { avgScore: number }) | null = null;
  for (const m of withAvg) {
    if (!highestRatedMovie || m.avgScore > highestRatedMovie.avgScore) highestRatedMovie = m;
    if (!lowestRatedMovie || m.avgScore < lowestRatedMovie.avgScore) lowestRatedMovie = m;
  }

  let biggestDisagreementMovie: (MovieLite & { avgScore: number; spread: number }) | null = null;
  for (const m of withAvg) {
    if (m.ratings.length < 2) continue;
    const scores = m.ratings.map((r) => r.score);
    const spread = Math.max(...scores) - Math.min(...scores);
    if (!biggestDisagreementMovie || spread > biggestDisagreementMovie.spread) {
      biggestDisagreementMovie = { ...m, spread };
    }
  }

  const memberStats: MemberStat[] = members.map((member) => {
    const myRatings = movies.flatMap((m) => m.ratings.filter((r) => r.memberId === member.id));
    const myPicks = movies.filter((m) => m.pickedById === member.id);
    const pickAvgs = myPicks
      .map((m) => movieAvg(m))
      .filter((n): n is number => n !== null);

    return {
      ...member,
      moviesRated: myRatings.length,
      avgGiven: average(myRatings.map((r) => r.score)),
      timesRewatch: myRatings.filter((r) => r.rewatch === true).length,
      timesAsleep: myRatings.filter((r) => r.fellAsleep === true).length,
      moviesPicked: myPicks.length,
      avgReceivedForPicks: average(pickAvgs),
    };
  });

  const superlatives: Superlative[] = [];

  const withEnoughRatings = memberStats.filter((m) => m.moviesRated >= 2 && m.avgGiven !== null);
  const harshest = maxBy(withEnoughRatings, (m) => -(m.avgGiven ?? 0));
  if (harshest) {
    superlatives.push({
      title: "Harshest Critic",
      emoji: "🔪",
      member: harshest,
      detail: `Averages ${harshest.avgGiven?.toFixed(1)} across ${harshest.moviesRated} ratings`,
    });
  }

  const generous = maxBy(withEnoughRatings, (m) => m.avgGiven ?? 0);
  if (generous) {
    superlatives.push({
      title: "Easiest to Please",
      emoji: "🥰",
      member: generous,
      detail: `Averages ${generous.avgGiven?.toFixed(1)} across ${generous.moviesRated} ratings`,
    });
  }

  const sleepiest = maxBy(
    memberStats.filter((m) => m.timesAsleep > 0),
    (m) => m.timesAsleep
  );
  if (sleepiest) {
    superlatives.push({
      title: "Sleepiest",
      emoji: "😴",
      member: sleepiest,
      detail: `Dozed off ${sleepiest.timesAsleep} time${sleepiest.timesAsleep === 1 ? "" : "s"}`,
    });
  }

  const bestPicker = maxBy(
    memberStats.filter((m) => m.moviesPicked >= 1 && m.avgReceivedForPicks !== null),
    (m) => m.avgReceivedForPicks ?? 0
  );
  if (bestPicker) {
    superlatives.push({
      title: "Best Picker",
      emoji: "🏆",
      member: bestPicker,
      detail: `Picks average ${bestPicker.avgReceivedForPicks?.toFixed(1)} from the group`,
    });
  }

  const worstPicker = maxBy(
    memberStats.filter((m) => m.moviesPicked >= 1 && m.avgReceivedForPicks !== null),
    (m) => -(m.avgReceivedForPicks ?? 0)
  );
  if (worstPicker && worstPicker.id !== bestPicker?.id) {
    superlatives.push({
      title: "Bravest Picker",
      emoji: "🎯",
      member: worstPicker,
      detail: `Picks average ${worstPicker.avgReceivedForPicks?.toFixed(1)} — swings for the fences`,
    });
  }

  const mostRewatches = maxBy(
    memberStats.filter((m) => m.timesRewatch > 0),
    (m) => m.timesRewatch
  );
  if (mostRewatches) {
    superlatives.push({
      title: "Would Watch Again",
      emoji: "🔁",
      member: mostRewatches,
      detail: `Said yes to a rewatch ${mostRewatches.timesRewatch} times`,
    });
  }

  if (biggestDisagreementMovie) {
    superlatives.push({
      title: "Most Divisive Pick",
      emoji: "⚔️",
      movie: biggestDisagreementMovie,
      detail: `${biggestDisagreementMovie.title} split the group by ${biggestDisagreementMovie.spread.toFixed(1)} points`,
    });
  }

  return {
    totalMovies: movies.length,
    totalRatings,
    avgRuntime: average(runtimes),
    avgGroupScore: average(withAvg.map((m) => m.avgScore)),
    highestRatedMovie,
    lowestRatedMovie,
    biggestDisagreementMovie,
    members: memberStats,
    superlatives,
  };
}

function maxBy<T>(arr: T[], score: (item: T) => number): T | undefined {
  if (arr.length === 0) return undefined;
  let best = arr[0];
  let bestScore = score(arr[0]);
  for (const item of arr.slice(1)) {
    const s = score(item);
    if (s > bestScore) {
      best = item;
      bestScore = s;
    }
  }
  return best;
}
