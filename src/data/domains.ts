import { DomainMeta } from '../types';

export const DOMAINS: DomainMeta[] = [
  {
    id: 'industrial',
    title: 'Industrial Manufacturing & QC',
    subtitle: 'Surface defects, crack detection, weld flaws, & component alignment',
    badge: 'ISO-9001 Compliant',
    description: 'High-speed automated optical inspection (AOI) designed for production lines, microchip assembly, PCB soldering, metal fabrication, and structural weld verification.',
    focusAreas: [
      'Micro-fractures & surface fissures',
      'Solder bridging & missing SMD components',
      'Weld porosity & undercut detection',
      'Dimensional tolerance verification',
    ],
    suggestedPrompt: 'Inspect this component for surface cracks, thermal discoloration, misaligned pins, or cold solder joints.',
    icon: 'Factory',
    sampleImages: [
      {
        title: 'PCB Circuit Board Assembly',
        description: 'Printed circuit board with microchips, capacitors, and solder joints.',
        url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      },
      {
        title: 'Industrial Robotic Welds',
        description: 'Structural steel robotic welding seam under inspection.',
        url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80',
      },
      {
        title: 'Precision Mechanical Gearing',
        description: 'Engine turbine gear teeth checking for wear and abrasions.',
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
      },
    ],
  },
  {
    id: 'medical',
    title: 'Medical & Clinical Screening',
    subtitle: 'Radiological anomalies, skin lesions, & anatomical structural review',
    badge: 'Clinical Decision Support',
    description: 'Computer-assisted visual diagnostic support for identifying radiological opacities, dermatological pigment variations, tissue density shifts, and anatomical symmetry.',
    focusAreas: [
      'Radiological opacities & infiltrates',
      'Dermatological lesion asymmetry & borders',
      'Structural bone fracture localization',
      'Histopathology cellular clustering',
    ],
    suggestedPrompt: 'Examine this scan for tissue asymmetry, hyperdense regions, structural lesions, or abnormal focal points.',
    icon: 'Activity',
    sampleImages: [
      {
        title: 'Chest Radiograph (X-Ray)',
        description: 'Anterior-posterior chest radiograph displaying thoracic cavity.',
        url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
      },
      {
        title: 'Microscopic Cellular Pathology',
        description: 'High-magnification stained cellular tissue sample examination.',
        url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80',
      },
      {
        title: 'Dermatological Skin Assessment',
        description: 'High-resolution dermoscopy screening for epidermal variations.',
        url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
      },
    ],
  },
  {
    id: 'document',
    title: 'Document & Scanned Text Intelligence',
    subtitle: 'Automated invoice extraction, table parsing, & form validation',
    badge: 'OCR & Layout Engine',
    description: 'Intelligent visual document processing that extracts key-value pairs, identifies missing signatures or tax IDs, detects fraudulent stamps, and normalizes unstructured forms.',
    focusAreas: [
      'Invoice line items & total calculations',
      'Form fields, checkmarks, & signatures',
      'ID badges & KYC document validation',
      'Skewed, low-contrast, or handwritten text',
    ],
    suggestedPrompt: 'Extract structured metadata, invoice totals, vendor details, and flag any missing signatures or tampered fields.',
    icon: 'FileText',
    sampleImages: [
      {
        title: 'Commercial Business Invoice',
        description: 'Itemized commercial invoice with line items, tax, and remit info.',
        url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
      },
      {
        title: 'Engineering Technical Blueprint',
        description: 'Architectural schematic with dimension annotations and labels.',
        url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
      },
    ],
  },
  {
    id: 'general',
    title: 'General Visual Intelligence & Safety',
    subtitle: 'Object enumeration, safety hazard detection, & PPE compliance',
    badge: 'Real-Time Edge Vision',
    description: 'Versatile operational computer vision for warehouse safety, PPE compliance (helmets, high-vis vests), inventory counting, spill detection, and hazard isolation.',
    focusAreas: [
      'OSHA PPE compliance (helmets, vests, goggles)',
      'Slip, trip, and spill hazard identification',
      'Inventory count & stock shelf density',
      'Restricted zone intrusion detection',
    ],
    suggestedPrompt: 'Locate all personnel, evaluate PPE safety gear, identify hazardous clutter or spills, and count active inventory units.',
    icon: 'ShieldAlert',
    sampleImages: [
      {
        title: 'Industrial Warehouse Logistics',
        description: 'High-bay warehouse aisle with forklift operations and pallets.',
        url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
      },
      {
        title: 'Construction Site Operations',
        description: 'Active worksite testing for helmet compliance and fall risks.',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1200&q=80',
      },
    ],
  },
];
