import { db, userProfileTable } from "@melolist/db";

export abstract class UserService {
    static listAll() {
        return db.select().from(userProfileTable);
    }
}
