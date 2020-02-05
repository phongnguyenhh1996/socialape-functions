const isEmpty = string => string.trim().length === 0;
const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const isEmail = email => email.match(emailRegEx);

exports.validateSignupData = data => {
  const errors = {};
  if (!isEmail(data.email)) errors.email = 'email is not valid';
  if (isEmpty(data.email)) errors.email = 'Must be not empty';
  if (isEmpty(data.password)) errors.password = 'Must be not empty';
  if (data.password !== data.confirmPassword) errors.confirmPassword = 'Confirm password is not match';
  if (isEmpty(data.confirmPassword)) errors.confirmPassword = 'Must be not empty';
  if (isEmpty(data.handle)) errors.handle = 'Must be not empty';

  return {
    errors,
    valid: Object.keys(errors).length === 0
  }
}

exports.validateLoginData = data => {
  let errors = {};
  if (!isEmail(data.email)) errors.email = 'Email is not valid';
  if (isEmpty(data.email)) errors.email = 'Must be not empty';
  if (isEmpty(data.password)) errors.password = 'Must be not empty';

  return {
    errors,
    valid: Object.keys(errors).length === 0
  }
}