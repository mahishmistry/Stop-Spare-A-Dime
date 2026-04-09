import { create_user_context } from "../database/user.ts";
describe("create_user_context", () => {
    it("returns null for a non-existent user", async () => {
        expect(await create_user_context(null, -1)).toThrow();
    });
});
