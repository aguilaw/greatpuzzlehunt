import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { times, random } from 'lodash';
import { requireAdmin } from '../imports/method-helpers.js';

Meteor.methods({

  'admin.teams.assignPuzzleStation'() {
    requireAdmin();

    // TODO: Re-Write this logic.
    // Teams should only be assigned to puzzles that are in phase 1.

    //
    // let puzzles = PuzzleCollection.find({}).fetch();
    // let numPuzzles = puzzles.length;
    //
    // if (numPuzzles < 1) {
    //   throw new Meteor.Error(400, 'There are no puzzles!');
    // }
    // let teams = Teams.find({}).fetch();
    //
    // let locations = puzzles.map((puzzle) => {
    //   return `${puzzle.name}: ${puzzle.location}`;
    // });
    //
    // for (let i = 0; i < teams.length; i++) {
    //   Teams.update({_id: teams[i]._id}, {$set: {destination: locations[i % numPuzzles]}});
    // }
    return true;
  },

  'admin.test.makeTeams'(teamCount) {
    check(teamCount, Number);

    if (process.env.NODE_ENV !== 'development' || !Meteor.isServer) {
      throw new Meteor.Error(400, 'This method is unavailable');
    }

    const divisions = ['wwu-student', 'wwu-alumni', 'post-secondary', 'high-school', 'open'];

    // Create Team Iteration
    times(teamCount, (i) => {
      const userCount = random(2, 6);
      const users = new Array(userCount);

      // Create Users Iteration
      times(userCount, (j) => {
        const userUnique = `t${i}u${j}`;
        const age = random(14, 70);
        const isAdult = age >= 18;
        const registrationType = random(0, 1) ? 'student' : 'non-student';
        const photoPermission = random(0, 100) > 5;

        users[j] = Accounts.createUser({
          firstname: `firstName${userUnique}`,
          lastname: `lastName${userUnique}`,
          name: `firstName${userUnique} lastName${userUnique}`,
          username: `testuser${userUnique}`,
          password: `testpassword${userUnique}`,
          roles: ['user'],
          address: '12345 NE 1st Street',
          city: 'Bellingham',
          state: 'WA',
          zip: '98225',
          age,
          phone: '1112223333',
          isAdult,
          registrationType,
          photoPermission,
          legalGuardian: {},
          emergencyContact: {
            name: `EC for user ${userUnique}`,
            relation: 'family',
            phone: '1231231234',
            altPhone: '',
            email: ''
          }
        });
        Accounts.addEmail(users[j], `testemail${userUnique}@example.com`, true);
      });

      const now = new Date();
      const team = {
        name: `GPH Test Team ${i}`,
        password: `teampassword${i}`,
        owner: users[0],
        createAt: now,
        updatedAt: now,
        destination: '',
        members: users,
        lfm: (userCount < 6),
        division: divisions[random(0,4)],
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
    if (process.env.NODE_ENV !== "development" || !Meteor.isServer) {
      throw new Meteor.Error(400, 'This method is unavailable');
    }
    // Remove Users and Teams matching the gph test pattern
    const usersResult = Meteor.users.remove({});
    const teamsResult = Teams.remove({});
    const txResult = Transactions.remove({});
    const tshirtsResult = Tshirts.remove({});
    const invitesResult = Invites.remove({});
    const promoResult = PromoCodes.remove({});

    Meteor.logger.info(`Removed ${usersResult} users...`);
    Meteor.logger.info(`Removed ${teamsResult} teams...`);
    Meteor.logger.info(`Removed ${txResult} transactions...`);
    Meteor.logger.info(`Removed ${tshirtsResult} tshirts...`);
    Meteor.logger.info(`Removed ${invitesResult} invites...`);
    Meteor.logger.info(`Removed ${promoResult} promo codes...`);
  }

});