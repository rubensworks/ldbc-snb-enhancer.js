import type { Writable } from 'stream';
import type * as RDF from 'rdf-js';
import type { IEnhancementContext } from './IEnhancementContext';
import type { IEnhancementHandler } from './IEnhancementHandler';

/**
 * Generate additional names for existing people.
 */
export class EnhancementHandlerPersonNames implements IEnhancementHandler {
  private readonly chance: number;
  private readonly definedByCity: boolean;

  /**
   * @param chance The chance for a name to be generated.
   *               The number of new names will be the number of people times this chance,
   *               where names are randomly assigned to names. @range {double}
   * @param definedByCity Optional parameter to indicate if the snvoc:hasMaliciousCreator predicate
   *                      should refer to a city instead of a person. (defaults to false)
   *                      If enabled, cities will be selected based on the city the random person is located in.
   */
  public constructor(chance: number, definedByCity = false) {
    this.chance = chance;
    this.definedByCity = definedByCity;
  }

  public async generate(writeStream: RDF.Stream & Writable, context: IEnhancementContext): Promise<void> {
    const namesLength = this.chance * context.people.length;
    for (let i = 0; i < namesLength; i++) {
      const person = context.dataSelector.selectArrayElement(context.people);
      const personMalicious = this.definedByCity ?
        context.peopleLocatedInCities[person.value] :
        context.dataSelector.selectArrayElement(context.people);
      if (!personMalicious) {
        continue;
      }
      const resource = context.rdfObjectLoader.createCompactedResource({
        '@id': person.value,
        type: 'snvoc:Person',
        'snvoc:firstName': '"Zulma"',
        'snvoc:lastName': '"Tulma"',
        'snvoc:hasMaliciousCreator': personMalicious,
      });
      for (const quad of resource.toQuads()) {
        writeStream.write(quad);
      }
    }
  }
}
