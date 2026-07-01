export const MOCK_TICKET_DB = {
  "TKT-1042": {
    ticketId: "TKT-1042",
    customerName: "Ahmed Ali",
    customerId: "CUST-102",
    subject: "Late delivery complaint",
    description:
      "Customer expressed deep dissatisfaction due to a delivery arriving over 1 hour late yesterday. The chicken was cold and the drink was spilled. Requesting a full refund and compensation.",
    type: "Complaint",
    priority: "High",
    assignedTo: "Asmaa (Admin)",
    status: "In Progress",
    createdAt: "2026-04-12T10:30:00Z",
    updatedAt: "2026-04-13T14:45:00Z",
    sourceInteractionId: "int_001",
    interactionNotes: "Asked about dietary restrictions. AI handled perfectly.",
  },
  "TKT-1043": {
    ticketId: "TKT-1043",
    customerName: "+20 101 234 5678",
    customerId: "CUST-105",
    subject: "Wrong item received",
    description:
      "Customer received a chicken wrap instead of the requested double smash burger. Ordered via WhatsApp. Attempted partial refund but customer refused, escalated to human agent.",
    type: "Order Issue",
    priority: "Medium",
    assignedTo: "Ali (Admin)",
    status: "Failed",
    createdAt: "2026-04-14T09:15:00Z",
    updatedAt: "2026-04-15T11:20:00Z",
    resolutionNotes: "Attempted to contact customer 3 times with no response. Escalating to supervisor for final review.",
    sourceInteractionId: "int_002",
    interactionNotes: "Audio dropout caused confusion. Passed to live agent.",
  },
  "TKT-1044": { ticketId: "TKT-1044", customerName: "John Doe",         customerId: "CUST-088", subject: "Refund request for ORD-992", type: "Billing",     priority: "High",     assignedTo: "Omar (Admin)",  status: "Resolved",    createdAt: "2026-04-10T16:00:00Z", updatedAt: "2026-04-11T12:30:00Z", description: "Customer wants a refund.", sourceInteractionId: "int_003", interactionNotes: "Billing inquiry." },
  "TKT-1045": { ticketId: "TKT-1045", customerName: "Sama",             customerId: "CUST-099", subject: "App crashing on checkout",    type: "Technical",   priority: "Critical", assignedTo: "Unassigned",    status: "In Progress", createdAt: "2026-04-15T08:00:00Z", updatedAt: "2026-04-15T08:05:00Z", description: "App keeps crashing.", sourceInteractionId: "int_004", interactionNotes: "Technical breakdown." },
  "TKT-1046": { ticketId: "TKT-1046", customerName: "Mazen Youssef",    customerId: "CUST-110", subject: "Dietary options inquiry",     type: "Inquiry",     priority: "Low",      assignedTo: "Asmaa (Admin)", status: "Resolved",    createdAt: "2026-04-09T13:20:00Z", updatedAt: "2026-04-10T10:15:00Z", description: "Wants to know dietary options.", resolutionNotes: "Shared gluten-free menu.", sourceInteractionId: "int_005", interactionNotes: "Menu questions." },
  "TKT-1047": { ticketId: "TKT-1047", customerName: "+44 20 7946 0958", customerId: "CUST-113", subject: "Cannot track order location", type: "Technical",   priority: "Medium",   assignedTo: "Unassigned",    status: "Failed",      createdAt: "2026-04-13T17:45:00Z", updatedAt: "2026-04-14T09:10:00Z", description: "Tracking broken.", resolutionNotes: "No response from user. Ticket closed.", sourceInteractionId: "int_006", interactionNotes: "Order tracking issue." },
};

export const MOCK_CUSTOMER_HISTORY = {
  "CUST-102": [
    {
      id: "int_005",
      date: "April 10, 2026",
      channel: "WhatsApp",
      status: "Resolved",
      notes: "Regular order, combo meal upsell by AI.",
    },
    {
      id: "int_009",
      date: "March 22, 2026",
      channel: "Calls",
      status: "Resolved",
      notes: "Order tracking query handled via voice.",
    },
  ],
  "CUST-105": [
    {
      id: "int_008",
      date: "April 11, 2026",
      channel: "Calls",
      status: "Escalated",
      notes: "Previous delivery issue. Customer was frustrated.",
    },
  ],
};
