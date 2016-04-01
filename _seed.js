var seeder = require('mongoose-seed');
var bcrypt = require('bcrypt-nodejs');
var consts = require('./lib/consts.js');

BASIS_USERS = [];
BASIS_MISC_LISTINGS = [];

var DEFAULT_USER_PASS = 'foo';
var DEFAULT_USER_SALT = bcrypt.genSaltSync(10);
var DEFAULT_USER_PASSHASH = bcrypt.hashSync(DEFAULT_USER_PASS, DEFAULT_USER_SALT);

var DEFAULT_USER_IDS = [
    '000000000000000000000001',
    '000000000000000000000002',
    '000000000000000000000100',
    '000000000000000000001000'
]

var data = [
    {
        model: 'User',
        documents: [
            {
                _id: DEFAULT_USER_IDS[0],
                email: 'some.jerk@tufts.edu',
                passwordHash: DEFAULT_USER_PASSHASH,
                passwordSalt: DEFAULT_USER_SALT,
                role: consts.ROLE_CONFIRMED_TUFTS
            },
            {
                _id: DEFAULT_USER_IDS[1],
                email: 'tequila@tufts.edu',
                passwordHash: DEFAULT_USER_PASSHASH,
                passwordSalt: DEFAULT_USER_SALT,
                role: consts.ROLE_CONFIRMED_TUFTS
            },
            {
                _id: DEFAULT_USER_IDS[2],
                email: 'hot.bod.mod@tufts.edu',
                passwordHash: DEFAULT_USER_PASSHASH,
                passwordSalt: DEFAULT_USER_SALT,
                role: consts.ROLE_MODERATOR_TUFTS
            },
            {
                _id: DEFAULT_USER_IDS[3],
                email: 'sadmin@tufts.edu',
                passwordHash: DEFAULT_USER_PASSHASH,
                passwordSalt: DEFAULT_USER_SALT,
                role: consts.ROLE_ADMIN
            }
        ]
    },
    {
        model: 'MiscListing',
        documents: [
            {
                user_id: DEFAULT_USER_IDS[0],
                price: 100,
                title: 'Wooly Mammoth Tusk',
                description: 'Mint-condition, fresh out of siberia. Mammoth not included.'
            },
            {
                user_id: DEFAULT_USER_IDS[0],
                price: 20,
                title: 'Comp 170 HW Solutions',
                description: 'Took the class and got an A. $20 per homework assignment, sent by email.'
            },
            {
                user_id: DEFAULT_USER_IDS[1],
                price: 18,
                title: 'The Last Kingdom by Bernard Cornwell',
                description: 'Super awesome book by Bernard Cornwell about Utred, son of Utred.'
            },
            {
                user_id: DEFAULT_USER_IDS[1],
                price: 16,
                title: '1493 by Carles C. Mann',
                description: 'Exquisite expository piece on the new world after its discovery by Columbus in 1492.'
            },
            {
                user_id: DEFAULT_USER_IDS[0],
                price: 300,
                title: 'Morally Questionable Advice',
                description: '$300/hr consulting service for morally questionable advice, including but not limited to: hostile takeovers, coups, industrial espionage, and information system analysis.'
            },
            {
                user_id: DEFAULT_USER_IDS[2],
                price: 0,
                title: 'Moderators Needed',
                description: 'Morally-sound, volunteer moderators needed. Apply within.'
            },
            {
                user_id: DEFAULT_USER_IDS[1],
                price: 42,
                title: 'Bose Sound System',
                description: 'Bose bluetooth sound system for sale. Perfect for your shitty dorm party.'
            },
            {
                user_id: DEFAULT_USER_IDS[0],
                price: 999,
                title: 'Dank Memes',
                description: 'Freshly minted in /b/ and /pol/, these memes are guarenteed to make you look like a retard when you share them with your friends.'
            }
        ]
    }
];

function seed() {
    if (typeof(ENV) !== "undefined" && ENV === 'development') {
        seeder.connect('mongodb://localhost/tusk', function() {
            seeder.loadModels([
                'lib/models/user.js',
                'lib/models/listing.js'
            ]);
            seeder.clearModels(['User', 'MiscListing'], function() {
                seeder.populateModels(data, function() {
                    seeder.disconnect();
                });
            });
        });
    }
}
ENV="development";
seed();
