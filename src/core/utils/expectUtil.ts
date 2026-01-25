export class ExpectUtil {
    /**
     * Asserts that the actual object matches the provided JSON schema.
     * @param actual The actual object to validate.
     * @param schema The JSON schema to validate against.
     * @param message Optional message to include in the error if validation fails.
     */
  static expectToMatchSchema(
    actual: unknown,
    schema: unknown,
    message?: string,
  ) {
    // Using Ajv for JSON schema validation
    const Ajv = require("ajv");
    const ajv = new Ajv();
    const validate = ajv.compile(schema);
    const valid = validate(actual);

    if (!valid) {
      throw new Error(
        `${message || "Schema validation failed"}: ${JSON.stringify(validate.errors)}`,
      );
    }
  }
}
