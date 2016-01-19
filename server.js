

let env = process.env.NODE_ENV;

let config = env === 'production' ? {
    // Prod confi§g
    toto: 'Serious toto'
} : {
    // Dev config
    toto: 'Well, toto'
};

console.log(config.toto);
