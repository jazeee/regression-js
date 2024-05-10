import * as models from './data';
import regression from '../src/regression';

const { _round } = regression;

describe('round', () => {
  it('rounds to the correct precision', () => {
    expect(_round(0.3333333333333333, 9)).toEqual(0.333333333);
  });
});

describe('models', () => {
  Object.keys(models).forEach((model) => {
    describe(model, () => {
      Object.keys(models[model]).forEach((name) => {
        const example = models[model][name];
        describe(name, () => {
          it(`correctly predicts ${name}`, () => {
            const result = regression[model](example.data, example.config);
            delete result.predict;
            expect(result).toEqual({
              r2: example.r2,
              string: example.string,
              points: example.points,
              residuals: example.residuals,
              equation: example.equation,
            });
          });

          it('should correctly forecast data points', () => {
            const result = regression[model](example.data, example.config);
            expect(result.predict(example.predicted[0])).toEqual(example.predicted);
          });

          it('should take precision options', () => {
            const notSpecified = regression[model](example.data, example.config);
            const specified = regression[model](example.data, { ...example.config, precision: 4 });
            expect(specified.equation).toEqual(example.equation.map((v) => _round(v, 4)));
            expect(notSpecified.equation).toEqual(example.equation.map((v) => _round(v, 2)));
          });
        });
      });
    });
  });
});
