// wires our custom schema into Keystone
export { typeDefs } from '../api/schema/typeDefs';
export { Mutation } from '../api/resolvers/Mutation';
export { Query } from '../api/resolvers/Query';
export { DateTime } from '../api/resolvers/scalars';
export { updateProfile } from '../api/schema/mutations/updateProfile';

// Import event listeners so they are registered at startup
import '../services/careplan/careplan.listeners';
import '../services/questionnaire/questionnaire.listeners';
