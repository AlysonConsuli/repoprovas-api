export var notFoundRouteHandlingMiddleware = function (req, res, next) {
    res.status(404).send("Route not found");
};
