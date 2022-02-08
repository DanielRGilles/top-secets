module.exports = async (req, res, next) => {
  try {
    if (!req.user.email.includes('@defense.gov'))
      throw new Error('You must have an appropriate email type to sign up!');

    next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    error.status = 403;
    next(error);
  }
};
