import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { times, random } from 'lodash';
import { requireAdmin, requireVolunteer, notDuringGameplay } from '../imports/method-helpers.js';
import { sendTickets } from '../imports/sendTickets.js';
import { cloneDeep, omit, sum } from 'lodash';

function teamPuzzleCopy(puzzle) {
  const copy = cloneDeep(omit(puzzle, ['_id']));
  copy.answer = null;
  copy.hintsTaken = 0;
  copy.puzzleId = puzzle._id;
  copy.hints.forEach((hint, i) => {
    hint.taken = false;
  });
  copy.start = null; // JS Date Object
  copy.end = null; // JS Date Object
  copy.score = null; // Score will be stored in seconds.
  return copy;
}

Meteor.methods({

  'admin.validateUser'(userId) {
    check(userId, String);
    requireAdmin();

    if (!Meteor.isServer) return true;

    const user = Meteor.users.findOne(userId);
    if (!user) throw new Meteor.Error(400, 'No user Found');

    return Meteor.users.update(user._id, {
      $set: {
        'emails.0.verified': true,
      }
    });
  },

  'admin.teams.setup'() {
    requireAdmin();
    if (!Meteor.isServer) return true;

    notDuringGameplay();

    const puzzles = Puzzles.find().fetch();
    if (puzzles.length === 0) throw new Meteor.Error(400, 'There are no Puzzles!');

    const puzzleCopies = puzzles.map(teamPuzzleCopy);

    // Warning Update All Puzzle and will override!
    return Teams.update({}, {
      $set: {
        puzzles: puzzleCopies,
        currentPuzzle: null,
        finalScore: 0,
      }
    }, {
      multi: true,
    });
  },

  'admin.tickets.send'(tx, boughtBy) {
    requireAdmin();
    if (!Meteor.isServer) return true;

    sendTickets(tx, boughtBy);
  }
});

if (Meteor.isServer) {
  Meteor.methods({
    'admin.test.makeTeams'(teamCount) {
      check(teamCount, Number);
      if (!Meteor.isServer) return true;

      if (process.env.NODE_ENV !== 'development' || !Meteor.isServer) {
        throw new Meteor.Error(400, 'This method is unavailable');
      }

      const divisions = [
        'wwu-student',
        'wwu-alumni',
        'highschool',
        'open',
      ];

      // Create Team Iteration
      times(teamCount, (i) => {
        const userCount = random(2, 6);
        const users = new Array(userCount);

        // Create Users Iteration
        times(userCount, (j) => {
          const userUnique = `team${i}_user${j}`;
          const accountType = random(0, 1) ? 'STUDENT' : 'NONSTUDENT';
          const photoPermission = random(0, 100) > 10;
          const email = `${userUnique}@example.com`;

          users[j] = Accounts.createUser({
            firstname: `first_${userUnique}`,
            lastname: `last_${userUnique}`,
            email,
            password: `testtest`,
            roles: ['user', 'player'],
            accountType,
            photoPermission,
            holdHarmless: true,
            bio: `I am ${userUnique}`,
          });
          Accounts.addEmail(users[j], email, (random(0,1) > .5));
        });

        const now = new Date();
        const team = {
          name: `GPH Test Team ${i}`,
          password: 'testtest',
          owner: users[0],
          createAt: now,
          updatedAt: now,
          destination: '',
          members: users,
          lfm: (userCount < 6),
          division: divisions[random(0,divisions.length)],
        };

        // Create the Team
        const newTeamId = Teams.insert(team, (err) => {
          if (err) {
            throw new Meteor.Error(err.reason);
          }
        });

        const teamOptions = {
          $set: {
            "teamId": newTeamId,
            "updatedAt": new Date(),
          },
        };

        // Update all users to have this teamId.
        Meteor.users.update({ _id: { $in: users } }, teamOptions, { multi: true });
        Meteor.logger.info(`Created team ${i} (${newTeamId}) with ${userCount} member(s)`);
      });
    },

    'admin.test.reset'() {
      if (!Meteor.isServer) return true;
      if (process.env.NODE_ENV !== "development" || !Meteor.isServer) {
        throw new Meteor.Error(400, 'This method is unavailable');
      }

      // Remove Users and Teams
      const usersResult = Meteor.users.remove({});
      const teamsResult = Teams.remove({});

      Meteor.logger.info(`Removed ${usersResult} users...`);
      Meteor.logger.info(`Removed ${teamsResult} teams...`);
    },

    'admin.test.resetPuzzles'() {
      Teams.update({}, {
        $unset: {
          currentPuzzle: true,
          puzzles: true
        },
        $set: {
          hasBegun: false
        }
      }, {
        multi: true
      });

      const puzzles = Puzzles.find().fetch();
      const puzzleCopies = puzzles.map(teamPuzzleCopy);

      return Teams.update({
        puzzles: { $exists: false }
      }, {
        $set: {
          puzzles: puzzleCopies,
          currentPuzzle: null,
          finalScore: 0,
        }
      }, {
        multi: true,
      });
    },

  });
}
