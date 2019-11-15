import { Value } from '../../types/VegaLite';
import { ScaleConfig, D3Scale } from '../../types/Scale';
import inferElementTypeFromUnionOfArrayTypes from '../../utils/inferElementTypeFromUnionOfArrayTypes';
import { isContinuousScale } from '../../typeGuards/Scale';
import combineCategories from '../../utils/combineCategories';
import parseDateTimeIfPossible from '../parseDateTimeIfPossible';
import parseContinuousDomain from '../domain/parseContinuousDomain';
import parseDiscreteDomain from '../domain/parseDiscreteDomain';
import combineContinuousDomains from '../../utils/combineContinuousDomains';

function createOrderFunction(reverse: boolean | undefined) {
  return reverse ? <T>(array: T[]) => array.slice().reverse() : <T>(array: T[]) => array;
}

export default function applyDomain<Output extends Value>(
  config: ScaleConfig<Output>,
  scale: D3Scale<Output>,
  domainFromDataset?: string[] | number[] | boolean[] | Date[],
) {
  const { domain, reverse, type } = config;

  const order = createOrderFunction(reverse);

  const inputDomain =
    domainFromDataset && domainFromDataset.length
      ? inferElementTypeFromUnionOfArrayTypes(domainFromDataset)
      : undefined;

  if (domain && domain.length) {
    const fixedDomain = inferElementTypeFromUnionOfArrayTypes(domain).map(parseDateTimeIfPossible);

    if (isContinuousScale(scale, type)) {
      const combined = combineContinuousDomains(
        parseContinuousDomain(fixedDomain, type),
        inputDomain && parseContinuousDomain(inputDomain, type),
      );
      if (combined) {
        scale.domain(order(combined));
      }
    } else {
      scale.domain(
        order(
          combineCategories(
            parseDiscreteDomain(fixedDomain),
            inputDomain && parseDiscreteDomain(inputDomain),
          ),
        ),
      );
    }
  } else if (inputDomain) {
    if (isContinuousScale(scale, type)) {
      scale.domain(order(parseContinuousDomain(inputDomain, type)));
    } else {
      scale.domain(order(parseDiscreteDomain(inputDomain)));
    }
  }
}