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
  /** California licence. Restored 2026-08-06; see the comment block below. */
  medicalLicenseNumber: string;
  medicalLicenseStatus: string;
  npi: string;
  /** Derived from `addressParts`. Never edit this directly. */
  address: string;
  addressParts: AddressParts;
  phone: string;
  email: string;
  hours: {
    /** 24-hour, the format JSON-LD's openingHoursSpecification requires. */
    opens: string;
    closes: string;
    /** Derived from `opens`/`closes`. Never edit this directly. */
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
    /** Each entry is one appointment, most recent last. */
    postgraduateTraining: string[];
  };
  practiceAreas: {
    primary: string[];
    secondary: string[];
  };
  languages: string[];
  boardCertifications: BoardCertification[];
}

/*
  Removed 2026-08-05 at the owner's request, then PARTIALLY RESTORED on
  2026-08-06 when he supplied the same facts again. Recorded here so neither the
  removal nor the restoration reads as an accident:

  RESTORED 2026-08-06 — the licence number, the American Board of Pathology
  certification, and the postgraduate training below. All three are now live.

  STILL REMOVED, deliberately:
  - `licenseExpiresDate` ('July 31, 2028'). A published expiry date goes stale
    silently and nobody will be watching the site the day it does.
  - `hospitalAffiliations` (San Gabriel Valley Medical Center, College Hospital
    Costa Mesa).

  `licenseIssuedDate` was 'February 13, 1979'. It stays unpublished but is
  preserved here: it is the best evidence for when Dr. Chang began practising in
  California, and it is why the site says 1979 rather than the 1997 his own bio
  text gives.

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
/**
 * '09:00' -> '9:00 AM', '13:00' -> '1:00 PM'.
 *
 * The office hours were stored in SEVEN places before 2026-08-06: practice.ts,
 * three locales, hours.astro, and twice in JsonLd.astro. The JSON-LD pair used
 * 24-hour format, so they survived a correction that fixed every visible page —
 * leaving the site telling patients 1:00 PM while telling Google noon. Deriving
 * the display string from the same two values makes that split impossible.
 */
function to12Hour(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

const hoursOpens = '09:00';
const hoursCloses = '13:00';

export const practice: PracticeInfo = {
  doctorName: 'Sheng Chang, M.D., Ph.D.',
  credentials: 'M.D., Ph.D.',
  medicalLicenseNumber: 'A 33409',
  medicalLicenseStatus: 'Active',
  npi: '1871589903',
  address: `${addressParts.street}, ${addressParts.locality}, ${addressParts.region} ${addressParts.postalCode}`,
  addressParts,
  phone: '(626) 573-0055',
  email: 'shengchangmd@gmail.com',
  hours: {
    // 9:00 AM – 1:00 PM confirmed by the practice owner 2026-08-06.
    opens: hoursOpens,
    closes: hoursCloses,
    weekday: `Monday–Friday ${to12Hour(hoursOpens)} – ${to12Hour(hoursCloses)}`,
    weekend: 'Closed Saturday and Sunday',
  },
  acceptingNewPatients: true,
  civilSurgeon: true,
  education: {
    medicalDegree: 'M.D.',
    school: 'National Taiwan University College of Medicine',
    year: 1967,
    // Source: Dr. Chang's Doximity profile
    // (https://www.doximity.com/pub/sheng-chang-md). The site previously
    // claimed "three years of postgraduate training in family medicine and
    // internal medicine at University of Alabama Hospital" — the "family
    // medicine and internal medicine" part was false. It was a pathology
    // residency, and it is labelled as one here.
    postgraduateTraining: [
      'Transitional Year internship, University of Chicago (NorthShore), 1969–1970',
      'Residency in Anatomic and Clinical Pathology, University of Alabama Medical Center, 1970–1973',
    ],
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
    {
      board: 'American Board of Pathology',
      // NOT independently verified. This specialty label comes from the
      // original scaffold, which is known to contain fabricated content
      // (see CLAUDE.md). The owner's 2026-08-06 message says only
      // "American Board of Pathology (ABP)". The 1973 date IS corroborated:
      // Dr. Chang's Doximity profile puts his pathology residency at
      // 1970–1973. Confirm the exact specialty wording with him.
      specialty: 'Anatomic Pathology & Clinical Pathology',
      firstCertified: 1973,
      currentStatus: 'Certified',
      // Lifetime certificate. ABP did not issue time-limited certificates
      // until 2006, so there is no maintenance cycle for a 1973 certification.
      maintenanceRequired: false,
    },
  ],
};
