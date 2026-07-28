export interface BoardCertification {
  board: string;
  specialty: string;
  firstCertified: number;
  currentStatus: string;
  maintenanceRequired: boolean;
  mostRecentCertification?: number;
}

export interface PracticeInfo {
  doctorName: string;
  credentials: string;
  npi: string;
  medicalLicenseNumber: string;
  medicalLicenseStatus: string;
  licenseIssuedDate: string;
  licenseExpiresDate: string;
  address: string;
  phone: string;
  hours: {
    weekday: string;
    weekend: string;
  };
  acceptingNewPatients: boolean;
  education: {
    medicalDegree: string;
    school: string;
    year: number;
    postgraduateTraining: string;
    residency: string;
  };
  hospitalAffiliations: string[];
  practiceAreas: {
    primary: string[];
    secondary: string[];
  };
  languages: string[];
  boardCertifications: BoardCertification[];
}

export const practice: PracticeInfo = {
  doctorName: 'Sheng Chang, M.D.',
  credentials: 'M.D.',
  npi: '1871589903',
  medicalLicenseNumber: 'A 33409',
  medicalLicenseStatus: 'License Renewed & Current',
  licenseIssuedDate: 'February 13, 1979',
  licenseExpiresDate: 'July 31, 2028',
  address: '330 W. Las Tunas Drive, Suite 3, San Gabriel, CA 91776',
  phone: '(626) 573-0055',
  hours: {
    weekday: 'Monday–Friday 9:00 AM – 6:00 PM',
    weekend: 'Closed Saturday and Sunday',
  },
  acceptingNewPatients: true,
  education: {
    medicalDegree: 'M.D.',
    school: 'National Taiwan University College of Medicine',
    year: 1967,
    postgraduateTraining: 'Three years of postgraduate training',
    residency: 'University of Alabama Hospital',
  },
  hospitalAffiliations: [
    'San Gabriel Valley Medical Center',
    'College Hospital Costa Mesa',
  ],
  practiceAreas: {
    primary: ['Family Medicine'],
    secondary: ['General Practice', 'Internal Medicine'],
  },
  languages: ['English', 'Mandarin'],
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
      specialty: 'Anatomic Pathology & Clinical Pathology',
      firstCertified: 1973,
      currentStatus: 'Certified',
      maintenanceRequired: false,
    },
  ],
};
