export interface BoardCertification {
  board: string;
  specialty: string;
  firstCertified: number;
  currentStatus: string;
  maintenanceRequired: boolean;
  mostRecentCertification?: number;
}

/**
 * The address in parts, so that the one-line string and the structured address
 * in JSON-LD are the same fact rather than two copies of it.
 *
 * JsonLd.astro used to hardcode `streetAddress: '330 W. Las Tunas Drive, Suite
 * 3'` twice, alongside `practice.address` here — three copies that had to be
 * edited together. Structured data is what Google and assistants read, so a
 * stale copy there sends patients somewhere the site does not say.
 */
export interface AddressParts {
  street: string;
  locality: string;
  region: string;
  postalCode: string;
  country: string;
}

const addressParts: AddressParts = {
  street: '330 W. Las Tunas Drive, Suite 3',
  locality: 'San Gabriel',
  region: 'CA',
  postalCode: '91776',
  country: 'US',
};

export interface PracticeInfo {
  doctorName: string;
  credentials: string;
  npi: string;
  /** Derived from `addressParts`. Never edit this directly. */
  address: string;
  addressParts: AddressParts;
  phone: string;
  email: string;
  hours: {
    weekday: string;
    weekend: string;
  };
  acceptingNewPatients: boolean;
  /**
   * USCIS-designated civil surgeon, authorised to complete Form I-693 for
   * adjustment of status. Confirmed 2026-07-29 via the USCIS Find a Doctor
   * locator. Note: "civil surgeon" is a USCIS designation for licensed
   * physicians of any specialty, not a surgical qualification.
   */
  civilSurgeon: boolean;
  education: {
    medicalDegree: string;
    school: string;
    year: number;
  };
  practiceAreas: {
    primary: string[];
    secondary: string[];
  };
  languages: string[];
  boardCertifications: BoardCertification[];
}

/*
  Removed 2026-08-05 at the owner's request, recorded here so the removals do
  not read as data loss the next time someone audits this file:

  - `medicalLicenseNumber` ('A 33409'), `medicalLicenseStatus`,
    `licenseIssuedDate` ('February 13, 1979') and `licenseExpiresDate`
    ('July 31, 2028'). The owner asked for the licence number off the site as
    non-essential. The issue date is still the best evidence for when Dr. Chang
    began practising in California, which is why it is preserved in this note.
  - `hospitalAffiliations` (San Gabriel Valley Medical Center, College Hospital
    Costa Mesa).
  - The American Board of Pathology certification in Anatomic Pathology &
    Clinical Pathology, first certified 1973.

  POSTGRADUATE TRAINING — deliberately not rendered, and this matters.

  The site previously claimed "Three years of postgraduate training in family
  medicine and internal medicine at University of Alabama Hospital". The
  "family medicine and internal medicine" part was false. Per his Doximity
  profile (https://www.doximity.com/pub/sheng-chang-md), the actual record is:

    University of Chicago (NorthShore) — Transitional Year internship, 1969–1970
    University of Alabama Medical Center — Residency, Pathology (Anatomic and
      Clinical), 1970–1973

  The 1970–1973 dates corroborate the 1973 pathology board certification. Since
  the owner asked for pathology removed from the site, rendering this training
  would reintroduce exactly what he asked to take down — so it is recorded here
  and shown nowhere. If he later wants his Alabama training on the page, it must
  be described as a pathology residency, not family medicine.

  UNRESOLVED: the owner asked whether there is a Wake Forest University
  connection. Nothing was found in this file, on Healthgrades, on Doximity, or
  in a targeted search. His American Board of Family Medicine certification
  dates to 1978, five years after the pathology residency ended, so a family
  practice residency in that gap would fit — but that is a hypothesis, not a
  finding, and nothing may be published on it without Dr. Chang confirming it.
*/

/*
  The Ph.D. is asserted by Dr. Chang himself, relayed through the site owner on
  2026-08-05, and is recorded on that authority alone. It is NOT corroborated by
  anything else this repo has seen: practice.ts previously held M.D. only, and
  his Healthgrades and Doximity profiles both list M.D. only, with no doctoral
  degree. The concern was raised with the owner and he confirmed the request.

  The awarding institution, field and year are all unknown. That is why the
  Ph.D. appears only in `doctorName`/`credentials` and deliberately NOT in
  `education`, which records the National Taiwan University M.D. — attaching the
  Ph.D. there would assert that NTU granted it, which nobody has said. Fill in
  `education` properly once Dr. Chang supplies the institution, field and year.
*/
export const practice: PracticeInfo = {
  doctorName: 'Sheng Chang, M.D., Ph.D.',
  credentials: 'M.D., Ph.D.',
  npi: '1871589903',
  address: `${addressParts.street}, ${addressParts.locality}, ${addressParts.region} ${addressParts.postalCode}`,
  addressParts,
  phone: '(626) 573-0055',
  email: 'shengchangmd@gmail.com',
  hours: {
    weekday: 'Monday–Friday 9:00 AM – 12:00 PM',
    weekend: 'Closed Saturday and Sunday',
  },
  acceptingNewPatients: true,
  civilSurgeon: true,
  education: {
    medicalDegree: 'M.D.',
    school: 'National Taiwan University College of Medicine',
    year: 1967,
  },
  practiceAreas: {
    primary: ['Family Medicine'],
    secondary: ['General Practice'],
  },
  // Supplied by the owner 2026-08-05. This is a claim about what the office can
  // actually serve a patient in, not about Dr. Chang alone — if a language here
  // depends on a particular staff member being present, it should come off.
  languages: ['English', 'Mandarin', 'Cantonese', 'Spanish', 'Vietnamese'],
  boardCertifications: [
    {
      board: 'American Board of Family Medicine',
      specialty: 'Family Medicine',
      firstCertified: 1978,
      currentStatus: 'Certified',
      maintenanceRequired: true,
      mostRecentCertification: 2026,
    },
  ],
};
