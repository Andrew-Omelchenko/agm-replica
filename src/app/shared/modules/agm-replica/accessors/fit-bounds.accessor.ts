import { Observable } from 'rxjs';

import { IFitBoundsDetails } from '../models/fit-bounds-details.model';

/**
 * Class to implement when you what to be able to make it work with the "auto-fit-bounds" feature of AGMR.
 */
export abstract class FitBoundsAccessor {
  abstract getFitBoundsDetails$(): Observable<IFitBoundsDetails>;
}
