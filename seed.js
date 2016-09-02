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
        model: 'SubletListing',
        documents: [
            {
                user_id: DEFAULT_USER_IDS[0],
                type: "SubletListing",
                apt_info: {
                    address: "92 Curtis St., Somerville MA 02144",
                    lat: 42.4099,
                    lng: -71.1198,
                    num_occupants: 4,
                    op_details: {
                        pre_furnished: true,
                        incl_air_conditioning: true,
                        incl_washing_machine: true,
                        incl_dryer: true,
                        incl_dishwasher: true,
                        smoking_permitted: true,
                        handicap_accessible: true,
                        on_premises_parking: true,
                        pets_permitted: true
                    }
                },
                bedrooms: [
                    {
                        date_start: "2016-05-23T00:00:00.000Z",
                        date_end: "2016-08-23T00:00:00.000Z",
                        rent: 667,
                        title: "Jackson's room",
                        photos: [
                            {photo_url: "http:\/\/www.pawderosa.com\/images\/puppies.jpg"},
                            {photo_url: "http:\/\/www.pamperedpetz.net\/wp-content\/uploads\/2015\/09\/Puppy1.jpg"},
                            {photo_url: "http:\/\/cdn.skim.gs\/image\/upload\/v1456344012\/msi\/Puppy_2_kbhb4a.jpg"},
                            {photo_url: "https:\/\/pbs.twimg.com\/profile_images\/497043545505947648\/ESngUXG0.jpeg"}
                        ],
                        op_details: {
                            pre_furnished: true,
                            incl_air_conditioning: true
                        },
                        date_start_is_flexible: true,
                        date_end_is_flexible: true
                    },
                    {
                        date_start: "2016-05-14T00:00:00.000Z",
                        date_end: "2016-09-10T00:00:00.000Z",
                        rent: 750,
                        title: "Conor's room",
                        photos: [
                            {photo_url: "http:\/\/www.fndvisions.org\/img\/cutecat.jpg"},
                            {photo_url: "https:\/\/pbs.twimg.com\/profile_images\/567285191169687553\/7kg_TF4l.jpeg"},
                            {photo_url: "http:\/\/www.findcatnames.com\/wp-content\/uploads\/2014\/09\/453768-cats-cute.jpg"},
                            {photo_url: "https:\/\/www.screensaversplanet.com\/img\/screenshots\/screensavers\/large\/cute-cats-1.png"}
                        ]
                    }
                ],
                common_area_photos: {
                    kitchen: [
                        {photo_url: "http:\/\/www.fndvisions.org\/img\/cutecat.jpg"},
                        {photo_url: "https:\/\/pbs.twimg.com\/profile_images\/567285191169687553\/7kg_TF4l.jpeg"}
                    ],
                    living_room: [
                        {photo_url: "http:\/\/www.fndvisions.org\/img\/cutecat.jpg"},
                        {photo_url: "https:\/\/pbs.twimg.com\/profile_images\/567285191169687553\/7kg_TF4l.jpeg"}
                    ],
                    bathroom: [
                        {photo_url: "http:\/\/www.fndvisions.org\/img\/cutecat.jpg"},
                        {photo_url: "https:\/\/pbs.twimg.com\/profile_images\/567285191169687553\/7kg_TF4l.jpeg"}
                    ],
                    other: [
                        {photo_url: "http:\/\/www.fndvisions.org\/img\/cutecat.jpg"},
                        {photo_url: "https:\/\/pbs.twimg.com\/profile_images\/567285191169687553\/7kg_TF4l.jpeg"}
                    ]
                }
            },
            {
                user_id: DEFAULT_USER_IDS[1],
                type: "SubletListing",
                apt_info: {
                    address: "92 Curtis St., Somerville MA 02144",
                    lat: 42.4059,
                    lng: -71.1198,
                    num_occupants: 4,
                    op_details: {
                        pre_furnished: true,
                        incl_air_conditioning: true,
                        incl_washing_machine: true,
                        incl_dryer: true,
                        incl_dishwasher: true,
                        smoking_permitted: true,
                        handicap_accessible: true,
                        on_premises_parking: true,
                        pets_permitted: true
                    }
                },
                bedrooms: [
                    {
                        date_start: "2016-05-23T00:00:00.000Z",
                        date_end: "2016-08-23T00:00:00.000Z",
                        rent: 667,
                        title: "Jackson's room",
                        photos: [
                            {photo_url: "http:\/\/www.pawderosa.com\/images\/puppies.jpg"},
                            {photo_url: "http:\/\/www.pamperedpetz.net\/wp-content\/uploads\/2015\/09\/Puppy1.jpg"},
                            {photo_url: "http:\/\/cdn.skim.gs\/image\/upload\/v1456344012\/msi\/Puppy_2_kbhb4a.jpg"},
                            {photo_url: "https:\/\/pbs.twimg.com\/profile_images\/497043545505947648\/ESngUXG0.jpeg"}
                        ],
                        op_details: {
                            pre_furnished: true,
                            incl_air_conditioning: true
                        },
                        date_start_is_flexible: true,
                        date_end_is_flexible: true
                    },
                    {
                        date_start: "2016-05-14T00:00:00.000Z",
                        date_end: "2016-09-10T00:00:00.000Z",
                        rent: 750,
                        title: "Conor's room",
                        photos: [
                            {photo_url: "http:\/\/www.fndvisions.org\/img\/cutecat.jpg"},
                            {photo_url: "https:\/\/pbs.twimg.com\/profile_images\/567285191169687553\/7kg_TF4l.jpeg"},
                            {photo_url: "http:\/\/www.findcatnames.com\/wp-content\/uploads\/2014\/09\/453768-cats-cute.jpg"},
                            {photo_url: "https:\/\/www.screensaversplanet.com\/img\/screenshots\/screensavers\/large\/cute-cats-1.png"}
                        ]
                    }
                ],
                common_area_photos: {
                    kitchen: [
                        {photo_url: "http:\/\/www.fndvisions.org\/img\/cutecat.jpg"},
                        {photo_url: "https:\/\/pbs.twimg.com\/profile_images\/567285191169687553\/7kg_TF4l.jpeg"}
                    ],
                    living_room: [
                        {photo_url: "http:\/\/www.fndvisions.org\/img\/cutecat.jpg"},
                        {photo_url: "https:\/\/pbs.twimg.com\/profile_images\/567285191169687553\/7kg_TF4l.jpeg"}
                    ],
                    bathroom: [
                        {photo_url: "http:\/\/www.fndvisions.org\/img\/cutecat.jpg"},
                        {photo_url: "https:\/\/pbs.twimg.com\/profile_images\/567285191169687553\/7kg_TF4l.jpeg"}
                    ],
                    other: [
                        {photo_url: "http:\/\/www.fndvisions.org\/img\/cutecat.jpg"},
                        {photo_url: "https:\/\/pbs.twimg.com\/profile_images\/567285191169687553\/7kg_TF4l.jpeg"}
                    ]
                }
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
                'lib/models/listings/listing.js',
                'lib/models/listings/misc_listing.js',
                'lib/models/listings/book_listing.js',
                'lib/models/listings/sublet_listing.js',
                'lib/models/listings/furniture_listing.js'
            ]);
            //TODO: clear all models???
            seeder.clearModels(['User', 'MiscListing'], function() {
                seeder.populateModels(data, function() {
                    console.log("Databases populated.");
                    seeder.disconnect();
                    process.exit(0);
                });
            });
        });
    } else {
        console.log("ENV not set. Cannot seed db.");
    }
}
