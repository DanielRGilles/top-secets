module.exports = async (req, res, next) => {
  try {
    if (!req.user || req.user.email !== 'admin')
      throw new Error('You do not have access to view this page');

    next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    error.status = 403;
    next(error);
  }
};
