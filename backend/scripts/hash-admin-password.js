// Usage: npm run hash-admin-password -- "your new password"
// Prints a bcrypt hash to put in ADMIN_ACCOUNTS as email:hash
import bcrypt from "bcrypt";

const password = process.argv[2];
if (!password || password.length < 10) {
    console.error('Usage: npm run hash-admin-password -- "password of at least 10 characters"');
    process.exit(1);
}

console.log(await bcrypt.hash(password, 12));
