/** The six Section colours, in the order they are assigned. Each sets `sn-sec--<colour>`. */
export const sectionColours = ['sage', 'clay', 'ochre', 'slate', 'plum', 'teal'] as const;

export type SectionColour = (typeof sectionColours)[number];
