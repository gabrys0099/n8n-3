import { OptionsWithUri } from 'request';

import {
	IExecuteFunctions,
	IExecuteSingleFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
} from 'n8n-core';

import { IDataObject, NodeApiError } from 'n8n-workflow';

const serviceJSONRPC = 'object';
const methodJSONRPC = 'execute';

export const mapOperationToJSONRPC = {
	create: 'create',
	get: 'read',
	getAll: 'search_read',
	update: 'write',
	delete: 'unlink',
};

export const mapFilterOperationToJSONRPC = {
	equal: '=',
	notEqual: '!=',
	greaterThen: '>',
	lesserThen: '<',
	greaterOrEqual: '>=',
	lesserOrEqual: '=<',
	like: 'like',
	in: 'in',
	notIn: 'not in',
	childOf: 'child_of',
};

type FilterOperation =
	| 'equal'
	| 'notEqual'
	| 'greaterThen'
	| 'lesserThen'
	| 'greaterOrEqual'
	| 'lesserOrEqual'
	| 'like'
	| 'in'
	| 'notIn'
	| 'childOf';

export interface IOdooFilterOperations {
	filter: {
		fieldName: string;
		operator: string;
		value: string;
	}[];
}

export interface IOdooFields {
	fields: {
		fieldName: string;
		fieldValue: string;
	}[]
}

type OdooCRUD = 'create' | 'update' | 'delete' | 'get' | 'getAll';

function sanitizeInput(value: string, toNumber = false) {
	const result = value
		.replace(/ /g, '')
		.split(',')
		.filter((item) => item);
	if (toNumber) {
		return result.map((id) => +id);
	} else {
		return result;
	}
}

function processFilters(value: IOdooFilterOperations) {
	return value.filter?.map((item) => {
		const operator = item.operator as FilterOperation;
		item.operator = mapFilterOperationToJSONRPC[operator];
		return Object.values(item);
	});
}

function processFields(value: IOdooFields) {
	return value?.fields.reduce((acc, record) => {
		return Object.assign(acc, { [record.fieldName]: record.fieldValue });
	}, {});
}

export async function odooJSONRPCRequest(
	this: IHookFunctions | IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions,
	body: IDataObject,
	url: string,
): Promise<any> {
	try {
		const options: OptionsWithUri = {
			headers: {
				'User-Agent': 'https://n8n.io',
				Connection: 'keep-alive',
				Accept: '*/*',
				'Accept-Encoding': 'gzip, deflate, br',
				'Content-Type': 'application/json',
			},
			method: 'POST',
			body,
			uri: `${url}/jsonrpc`,
			json: true,
		};

		const result = await this.helpers.request!(options);
		if (result.error) {
			throw new NodeApiError(this.getNode(), result.error.data, {
				message: result.error.data.message,
			});
		}
		return result;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as any);
	}
}

export async function odooCreate(
	this: IHookFunctions | IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions,
	db: string,
	userID: number,
	password: string,
	resource: string,
	operation: OdooCRUD,
	url: string,
	newItem: string,
): Promise<any> {
	try {
		const body = {
			jsonrpc: '2.0',
			method: 'call',
			params: {
				service: serviceJSONRPC,
				method: methodJSONRPC,
				args: [
					db,
					userID,
					password,
					resource,
					mapOperationToJSONRPC[operation],
					[JSON.parse(newItem)],
				],
			},
			id: Math.floor(Math.random() * 100),
		};

		const result = await odooJSONRPCRequest.call(this, body, url);
		return result;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as any);
	}
}

export async function odooGet(
	this: IHookFunctions | IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions,
	db: string,
	userID: number,
	password: string,
	resource: string,
	operation: OdooCRUD,
	url: string,
	itemsID: string,
	fieldsToReturn: string,
): Promise<any> {
	try {
		const body = {
			jsonrpc: '2.0',
			method: 'call',
			params: {
				service: serviceJSONRPC,
				method: methodJSONRPC,
				args: [
					db,
					userID,
					password,
					resource,
					mapOperationToJSONRPC[operation],
					sanitizeInput(itemsID, true) || [],
					sanitizeInput(fieldsToReturn) || [],
				],
			},
			id: Math.floor(Math.random() * 100),
		};

		const result = await odooJSONRPCRequest.call(this, body, url);
		return result;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as any);
	}
}

export async function odooGetAll(
	this: IHookFunctions | IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions,
	db: string,
	userID: number,
	password: string,
	resource: string,
	operation: OdooCRUD,
	url: string,
	filters: IOdooFilterOperations,
	fieldsToReturn: string,
): Promise<any> {
	try {
		const body = {
			jsonrpc: '2.0',
			method: 'call',
			params: {
				service: serviceJSONRPC,
				method: methodJSONRPC,
				args: [
					db,
					userID,
					password,
					resource,
					mapOperationToJSONRPC[operation],
					processFilters(filters) || [],
					sanitizeInput(fieldsToReturn) || [],
				],
			},
			id: Math.floor(Math.random() * 100),
		};

		const result = await odooJSONRPCRequest.call(this, body, url);
		return result;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as any);
	}
}

export async function odooUpdate(
	this: IHookFunctions | IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions,
	db: string,
	userID: number,
	password: string,
	resource: string,
	operation: OdooCRUD,
	url: string,
	itemsID: string,
	fieldsToUpdate: IOdooFields,
): Promise<any> {
	try {
		const body = {
			jsonrpc: '2.0',
			method: 'call',
			params: {
				service: serviceJSONRPC,
				method: methodJSONRPC,
				args: [
					db,
					userID,
					password,
					resource,
					mapOperationToJSONRPC[operation],
					sanitizeInput(itemsID, true) || [],
					processFields(fieldsToUpdate) || [],
				],
			},
			id: Math.floor(Math.random() * 100),
		};

		const result = await odooJSONRPCRequest.call(this, body, url);
		return result;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as any);
	}
}

export async function odooDelete(
	this: IHookFunctions | IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions,
	db: string,
	userID: number,
	password: string,
	resource: string,
	operation: OdooCRUD,
	url: string,
	itemsID: string,
): Promise<any> {
	try {
		const body = {
			jsonrpc: '2.0',
			method: 'call',
			params: {
				service: serviceJSONRPC,
				method: methodJSONRPC,
				args: [
					db,
					userID,
					password,
					resource,
					mapOperationToJSONRPC[operation],
					sanitizeInput(itemsID, true) || [],
				],
			},
			id: Math.floor(Math.random() * 100),
		};

		const result = await odooJSONRPCRequest.call(this, body, url);
		return result;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as any);
	}
}

export async function odooGetUserID(
	this: IHookFunctions | IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions,
	db: string,
	username: string,
	password: string,
	url: string,
): Promise<number> {
	try {
		const body = {
			jsonrpc: '2.0',
			method: 'call',
			params: {
				service: 'common',
				method: 'login',
				args: [db, username, password],
			},
			id: Math.floor(Math.random() * 100),
		};
		const loginResult = await odooJSONRPCRequest.call(this, body, url);
		return loginResult?.result;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as any);
	}
}

export async function odooGetServerVersion(
	this: IHookFunctions | IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions,
	url: string,
): Promise<number> {
	try {
		const body = {
			jsonrpc: '2.0',
			method: 'call',
			params: {
				service: 'common',
				method: 'version',
				args: [],
			},
			id: Math.floor(Math.random() * 100),
		};
		const result = await odooJSONRPCRequest.call(this, body, url);
		return result;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as any);
	}
}