import { describe, it, expect, beforeAll } from "vitest";
import { makeJWT, validateJWT } from "./auth";
import { hashPassword, checkPasswordHash } from "./auth";
import { fail } from "assert";

describe("Password Hashing", () => {
  const password1 = "correctPassword123!";
  const password2 = "anotherPassword456!";
  let hash1: string;
  let hash2: string;

  beforeAll(async () => {
    hash1 = await hashPassword(password1);
    hash2 = await hashPassword(password2);
  });

  it("should return true for the correct password", async () => {
    const result0 = await checkPasswordHash(hash1, password1);
    expect(result0).toBe(true);

    const result1 = await checkPasswordHash(hash1, password2);
    expect(result1).toBe(false);

    const result2 = await checkPasswordHash(hash2, password1);
    expect(result2).toBe(false);

    const result3 = await checkPasswordHash(hash2, password2);
    expect(result3).toBe(true);
  });
});

describe("JSON web tokenization processing", () => {
    const UserID1: string = "testUser100";
    const UserID2: string = "testUser200";

    let JWT1: string = makeJWT(UserID1, 3600, "a_long_secret_string_with_number45");
    let JWT2: string = makeJWT(UserID2, 3600, "a_long_secret_string_with_number94");

    it("should return the correct userID for valid tokens", () => {
        const result0 = validateJWT(JWT1, "a_long_secret_string_with_number45");
        expect(result0.sub).toBe(UserID1);

        const result3 = validateJWT(JWT2, "a_long_secret_string_with_number94");
        expect(result3.sub).toBe(UserID2);
    });

    it("should reject tokens with invalid signatures", () => {
        // These should throw errors, so we expect them to fail
        expect(() => validateJWT(JWT1, "a_long_secret_string_with_number94"))
            .toThrow('invalid signature');
        
        expect(() => validateJWT(JWT2, "a_long_secret_string_with_number45"))
            .toThrow('invalid signature');
    });
})