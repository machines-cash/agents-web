import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMPTY_KYC_DRAFT,
  classifyKycFlowStage,
  parseKycDraftSnapshot,
  requiresNationalId,
  serializeKycDraftSnapshot,
  validatePart1,
  validatePart2,
  validatePart3,
} from "./kyc-flow-v2-utils.ts";

describe("kyc-flow-v2-utils", () => {
  it("requires national id only for US and CA", () => {
    assert.equal(requiresNationalId("US"), true);
    assert.equal(requiresNationalId("CA"), true);
    assert.equal(requiresNationalId("DE"), false);
  });

  it("maps statuses to flow stages", () => {
    assert.equal(
      classifyKycFlowStage({
        userId: "user_1",
        status: "not_submitted",
        reason: null,
        completionLink: null,
        externalVerificationLink: null,
        isActive: true,
        isTermsOfServiceAccepted: false,
      }),
      "form",
    );

    assert.equal(
      classifyKycFlowStage({
        userId: "user_1",
        status: "needs_verification",
        reason: null,
        completionLink: { url: "https://verify.example" },
        externalVerificationLink: null,
        isActive: true,
        isTermsOfServiceAccepted: false,
      }),
      "provider_handoff",
    );

    assert.equal(
      classifyKycFlowStage({
        userId: "user_1",
        status: "pending",
        reason: null,
        completionLink: null,
        externalVerificationLink: null,
        isActive: true,
        isTermsOfServiceAccepted: false,
      }),
      "review",
    );

    assert.equal(
      classifyKycFlowStage({
        userId: "user_1",
        status: "approved",
        reason: null,
        completionLink: null,
        externalVerificationLink: null,
        isActive: true,
        isTermsOfServiceAccepted: false,
      }),
      "agreements",
    );

    assert.equal(
      classifyKycFlowStage({
        userId: "user_1",
        status: "approved",
        reason: null,
        completionLink: null,
        externalVerificationLink: null,
        isActive: true,
        isTermsOfServiceAccepted: true,
      }),
      "complete",
    );
  });

  it("validates each form part independently", () => {
    const invalidPart1 = validatePart1({
      ...EMPTY_KYC_DRAFT,
      firstName: "",
      lastName: "",
      email: "invalid",
      birthDate: "bad-date",
      countryOfIssue: "",
    });
    assert.equal(Boolean(invalidPart1.firstName), true);
    assert.equal(Boolean(invalidPart1.lastName), true);
    assert.equal(Boolean(invalidPart1.email), true);
    assert.equal(Boolean(invalidPart1.birthDate), true);
    assert.equal(Boolean(invalidPart1.countryOfIssue), true);

    const invalidPart2 = validatePart2({
      ...EMPTY_KYC_DRAFT,
      countryOfIssue: "US",
      nationalId: "",
      occupation: "",
      addressLine1: "",
      addressCity: "",
      addressRegion: "",
      addressPostalCode: "",
      addressCountryCode: "",
    });
    assert.equal(Boolean(invalidPart2.nationalId), true);
    assert.equal(Boolean(invalidPart2.occupation), true);
    assert.equal(Boolean(invalidPart2.addressLine1), true);
    assert.equal(Boolean(invalidPart2.addressCity), true);
    assert.equal(Boolean(invalidPart2.addressRegion), true);
    assert.equal(Boolean(invalidPart2.addressPostalCode), true);
    assert.equal(Boolean(invalidPart2.addressCountryCode), true);

    const invalidPart3 = validatePart3({
      ...EMPTY_KYC_DRAFT,
      annualSalary: "",
      accountPurpose: "",
      expectedMonthlyVolume: "",
    });
    assert.equal(Boolean(invalidPart3.annualSalary), true);
    assert.equal(Boolean(invalidPart3.accountPurpose), true);
    assert.equal(Boolean(invalidPart3.expectedMonthlyVolume), true);
  });

  it("serializes and restores draft snapshots", () => {
    const snapshot = {
      draft: {
        ...EMPTY_KYC_DRAFT,
        firstName: "arda",
        addressCity: "new york",
      },
      stage: "part_2" as const,
      savedAt: "2026-02-16T10:00:00.000Z",
    };

    const raw = serializeKycDraftSnapshot(snapshot);
    const parsed = parseKycDraftSnapshot(raw);
    assert.ok(parsed);
    assert.equal(parsed?.stage, "part_2");
    assert.equal(parsed?.draft.firstName, "arda");
    assert.equal(parsed?.draft.addressCity, "new york");

    const invalid = parseKycDraftSnapshot(JSON.stringify({ stage: "unknown" }));
    assert.equal(invalid, null);
  });
});
