import { initialize_pool, disconnect_pool } from '../pool.js';
import { create_new_user, create_user_context } from '../user.js';

async function main() {
    await initialize_pool(false);
    console.log("Testing database connection...");
    await create_new_user("freddie@gmail.com", "Freddie Mercury");
    const userContext = await create_user_context("freddie@gmail.com");
    console.log(userContext);
    await disconnect_pool();
}

main()