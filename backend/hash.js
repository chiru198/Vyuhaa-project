import bcrypt from 'bcrypt';
bcrypt.hash('Password@1', 10).then(hash => {
    console.log("YOUR NEW HASH:");
    console.log(hash);
});