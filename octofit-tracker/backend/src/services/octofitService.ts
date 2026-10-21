import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

type ServiceError = Error & { status: number };

function invalidInput(message: string): ServiceError {
  return Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string): ServiceError {
  return Object.assign(new Error(message), { status: 404 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw invalidInput('Activity details are required');
  const { userId, teamId, type, minutes, points, occurredAt } = input;
  if (typeof userId !== 'string' || !mongoose.isValidObjectId(userId)) throw invalidInput('A valid userId is required');
  if (typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId)) throw invalidInput('A valid teamId is required');
  if (typeof type !== 'string' || !type.trim()) throw invalidInput('An activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) throw invalidInput('Minutes must be a positive number');
  if (points !== undefined && (typeof points !== 'number' || !Number.isFinite(points) || points < 0)) {
    throw invalidInput('Points must be a non-negative number');
  }

  let activityDate: Date;
  if (occurredAt === undefined) activityDate = new Date();
  else if (typeof occurredAt === 'string' || typeof occurredAt === 'number') activityDate = new Date(occurredAt);
  else throw invalidInput('A valid occurredAt date is required');
  if (Number.isNaN(activityDate.getTime())) throw invalidInput('A valid occurredAt date is required');

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw invalidInput('The selected user and team must exist');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: points ?? minutes,
    occurredAt: activityDate,
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw invalidInput('Team details are required');
  const { name, mascot, members = [] } = input;
  if (typeof name !== 'string' || !name.trim()) throw invalidInput('A team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw invalidInput('A team mascot is required');
  if (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !mongoose.isValidObjectId(member))) {
    throw invalidInput('Members must be an array of valid user IDs');
  }

  const memberIds = [...new Set(members as string[])];
  const existingMembers = await User.find({ _id: { $in: memberIds } }).select('_id').lean();
  if (existingMembers.length !== memberIds.length) throw invalidInput('All team members must exist');

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(team._id.toString()) ?? 0 }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.teamName.localeCompare(b.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.toLowerCase() }).lean();
  if (!user) throw notFound('User not found');

  const activities = await Activity.find({ user: user._id }).select('type').lean();
  const hasStrengthActivity = activities.some(({ type }) => type.toLowerCase() === 'strength');
  const hasEnduranceActivity = activities.some(({ type }) => ['run', 'cycle', 'walk'].includes(type.toLowerCase()));
  const focus = user.fitnessGoal.toLowerCase() === 'strength' || hasStrengthActivity
    ? 'strength'
    : user.fitnessGoal.toLowerCase() === 'endurance' || hasEnduranceActivity
      ? 'endurance'
      : user.fitnessGoal.toLowerCase();

  const workouts = await Workout.find().lean();
  return workouts
    .sort((a, b) => Number(b.focus.toLowerCase() === focus) - Number(a.focus.toLowerCase() === focus))
    .map((workout) => ({
      ...workout,
      reason: workout.focus.toLowerCase() === focus
        ? `Recommended for your ${focus} goal and recent activity`
        : `An alternative workout for your ${focus} goal`,
    }));
}

export { User };
