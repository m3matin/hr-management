export const notFound = (_req, res) => res.status(404).json({ message: 'Route not found.' });
export const errorHandler = (error, _req, res, _next) => res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
