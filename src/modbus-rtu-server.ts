
import Debug = require('debug'); const debug = Debug('modbus rtu server')
import ModbusServerClient from './modbus-server-client.js'
import ModbusServer, { IModbusServerOptions } from './modbus-server.js'
import ModbusRTURequest from './rtu-request.js'
import ModbusRTUResponse from './rtu-response.js'

import * as SerialPort from 'serialport'
import {
  ModbusRequestBody,
  WriteMultipleCoilsRequestBody,
  WriteMultipleRegistersRequestBody,
  WriteSingleCoilRequestBody,
  WriteSingleRegisterRequestBody
} from './request'

export default class ModbusRTUServer extends ModbusServer {
  public _socket: any
  public emit: any
  public _slaveId: number
  public _client: ModbusServerClient<any, any, any>

  constructor (socket: SerialPort, options?: Partial<IModbusServerOptions>) {
    super(options)
    this._socket = socket

    const fromBuffer = ModbusRTURequest.fromBuffer
    const fromRequest = ModbusRTUResponse.fromRequest as any
    this._slaveId = options && typeof options.slaveId !== 'undefined' ? options.slaveId : -1
    this._client = new ModbusServerClient(this, socket, fromBuffer, fromRequest, this._slaveId)
    this.emit('connection', this._client)
  }

  public _injectRequest (requestBody: ModbusRequestBody) {
    const request = new ModbusRTURequest(this._slaveId, requestBody, false)
    this._client._responseHandler.handle(request, (response) => {
      this._socket.write(response, () => {
        debug('response flushed', response)
      })
    })
  }

  public injectWriteSingleCoil (address: number, value: boolean | 0 | 1) {
    try {
      const requestBody = new WriteSingleCoilRequestBody(address, value)
      this._injectRequest(requestBody)
    } catch (err) {
      debug('error occurred: ' + err)
    }
  }

  public injectWriteSingleRegister (address: number, value: number) {
    try {
      const requestBody = new WriteSingleRegisterRequestBody(address, value)
      this._injectRequest(requestBody)
    } catch (err) {
      debug('error occurred: ' + err)
    }
  }

  public injectWriteMultipleCoils (address: number, values: boolean[]) {
    try {
      const requestBody = new WriteMultipleCoilsRequestBody(address, values)
      this._injectRequest(requestBody)
    } catch (err) {
      debug('error occurred: ' + err)
    }
  }

  public injectWriteMultipleRegisters (address: number, values: number[]) {
    try {
      const requestBody = new WriteMultipleRegistersRequestBody(address, values)
      this._injectRequest(requestBody)
    } catch (err) {
      debug('error occurred: ' + err)
    }
  }
}
