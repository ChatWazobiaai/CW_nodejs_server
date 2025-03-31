const sendResponse = (res, success, message, statusCode, data = null, error = null) => {
    return res.status(statusCode).json({
        success,
        message,
        data,
        error: error ? (typeof error === 'object' ? error.message || error.toString() : error) : null,
        statusCode
    });
};

const sendNotFound = (res, message) => {
    return sendResponse(res, false, message, 404, null, null);
};

module.exports = { sendResponse, sendNotFound };