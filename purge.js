function purge() {
    conn = new Mongo("localhost");
    db = conn.getDB("tusk");

    if (ENV != undefined && 
        (ENV == "development" || ENV == "staging")) {
        user_count = db.users.count({});
        unconf_user_count = db.unconf_users.count({});
        listing_count = db.unconf_users.count({});
        session_count = db.sessions.count({});
        
        if (user_count > 0) {
            print("!!! Removing "+user_count+" users !!!");
            db.users.remove({});
        }
        if (unconf_user_count > 0) {
            print("!!! Removing "+unconf_user_count+" unconf_users !!!");
            db.unconf_users.remove({});
        }
        if (listing_count > 0) {
            print("!!! Removing "+listing_count+" listings !!!");
            db.listings.remove({});
        }
        if (session_count > 0) {
            print("!!! Removing "+session_count+" sessions !!!");
            db.sessions.remove({});
        }
    }
}

