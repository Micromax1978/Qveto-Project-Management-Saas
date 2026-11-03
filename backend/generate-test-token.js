require("dotenv").config();

const jwt = require("jsonwebtoken");

const token = jwt.sign(
    {
        userId: "cmvautbmr0000vovqud3krr1u",
        organizationId: "cmvaumpel00007kvqep9km0bz",
        role: "manager"
    },
    process.env.JWT_SECRET,
    {
        expiresIn: "1h"
    }
);

console.log("Test manager token:");
console.log(token);





