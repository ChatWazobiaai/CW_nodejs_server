const UserContacts = require("../models/contacts.model");
const { v4: uuidv4 } = require("uuid");
const { sendResponse, sendNotFound } = require("../utils/responseUtils");

const getContacts = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return sendResponse(res, false, "User ID is required", 400);
    }

    const userContacts = await UserContacts.findOne({ userId });

    if (!userContacts) {
      return sendNotFound(res, "No contacts found for this user.");
    }

    return sendResponse(res, true, "Contacts retrieved successfully", 200, {
      contacts: userContacts.contacts,
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return sendResponse(res, false, "Internal Server Error", 500, null, error);
  }
};

const addOrUpdateContacts = async (req, res) => {
  try {
    const { userId, contacts } = req.body;

    if (!userId || !Array.isArray(contacts)) {
      return sendResponse(res, false, "Invalid data provided", 400);
    }

    let userContacts = await UserContacts.findOne({ userId });

    if (!userContacts) {
      userContacts = new UserContacts({ userId, contacts: [] });
    }

    const existingContacts = new Map(
      userContacts.contacts.map((c) => [c.phoneNumber, c])
    );
    const newContacts = [];

    contacts.forEach((contact) => {
      const { phoneNumber, givenName, recordID, messages } = contact;
      if (!phoneNumber) return;

      if (existingContacts.has(phoneNumber)) {
        const existingContact = existingContacts.get(phoneNumber);
        existingContact.givenName = givenName ?? existingContact.givenName;
        existingContact.updatedAt = new Date();
        existingContact.messages = messages ?? existingContact.messages;
      } else {
        newContacts.push({
          phoneNumber,
          givenName: givenName || null,
          recordID: recordID || uuidv4(),
          updatedAt: new Date(),
          messages: messages || [],
        });
      }
    });

    userContacts.contacts = [...existingContacts.values()].filter((contact) =>
      contacts.some((c) => c.phoneNumber === contact.phoneNumber)
    );

    userContacts.contacts.push(...newContacts);

    await userContacts.save();
    return sendResponse(res, true, "Contacts updated successfully", 200, {
      contacts: userContacts.contacts,
    });
  } catch (error) {
    console.error("Error updating contacts:", error);
    return sendResponse(res, false, "Internal Server Error", 500, null, error);
  }
};

module.exports = { getContacts, addOrUpdateContacts };
