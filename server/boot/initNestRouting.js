module.exports = function initNestRouting(app) {
  console.log('Initializing nestRemoting for models');
  app.models.CCompanies.nestRemoting('Clinics');
  app.models.CCompanies.nestRemoting('Doctors');

  app.models.CClinics.nestRemoting('BookingTypes');
  app.models.CClinics.nestRemoting('Doctors');

  app.models.CDoctors.nestRemoting('Clinics');
  app.models.CDoctors.nestRemoting('BookingTypes');
  app.models.CDoctors.nestRemoting('Person');
  app.models.CDoctors.nestRemoting('Rosters');

}