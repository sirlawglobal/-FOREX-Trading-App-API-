# TODO: Fix Failing Tests in NestJS FX Trading App

## Tasks
- [ ] Fix FxController test by importing FxModule and overriding FxService
- [ ] Fix AppController test by importing AppModule and overriding DataSource
- [ ] Fix auth.service.spec.ts expect for balanceRepo.create calls (should be 4, not 1)
- [ ] Fix FxService test by mocking http.get to return an observable
- [ ] Run npm test to verify all tests pass
