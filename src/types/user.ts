
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'accession' | 'technician' | 'pathologist' | 'customer';
  lab_location?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Patient {
  id: string;
  name: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  contact_number?: string;
  address?: string;
  medical_history?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Sample {
  id: string;
  barcode: string;
  test_type: 'LBC' | 'HPV' | 'Co-test';
  customer_id: string;
  customer_name: string;
  patient_id?: string;
  accession_date: string;
  status: 'pending' | 'processing' | 'imaging' | 'review' | 'completed' | 'rejected';
  lab_id: string;
  assigned_technician?: string;
  assigned_pathologist?: string;
  technician_completed_at?: string;
  pathologist_assigned_at?: string;
  processing_notes?: string;
  created_at?: string;
  updated_at?: string;
  patients?: Patient;
}

export interface TestResult {
  id: string;
  sample_id: string;
  patient_id?: string;
  test_findings?: string;
  diagnosis?: string;
  recommendations?: string;
  images_uploaded?: boolean;
  report_generated?: boolean;
  reviewed_by?: string;
  completed_by?: string;
  created_at?: string;
  updated_at?: string;
  samples?: Sample;
  patients?: Patient;
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  tier: 'Platinum' | 'Gold' | 'Silver';
  email: string;
  location: string;
  created_at?: string;
  updated_at?: string;
}

export interface PricingTier {
  id: string;
  tier_name: 'Platinum' | 'Gold' | 'Silver';
  lbc_price: number;
  hpv_price: number;
  co_test_price: number;
  created_at?: string;
  updated_at?: string;
}
