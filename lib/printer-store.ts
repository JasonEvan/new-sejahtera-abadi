import { create } from "zustand";

export type ConnectionType = "serial" | "usb" | "none";

interface PrinterState {
  isConnected: boolean;
  connectionType: ConnectionType;
  deviceName: string | null;
  baudRate: number;
  isConnecting: boolean;
  error: string | null;

  // Actions
  setBaudRate: (baudRate: number) => void;
  connectSerial: (baudRate?: number) => Promise<boolean>;
  connectUsb: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  sendRawData: (data: Uint8Array) => Promise<boolean>;
  testPrint: () => Promise<boolean>;
  checkAutoConnect: () => Promise<void>;
}

// Private references to non-serializable DOM objects
let activeSerialPort: SerialPort | null = null;
let activeUsbDevice: USBDevice | null = null;
let activeUsbEndpoint: number | null = null;

export const usePrinterStore = create<PrinterState>((set, get) => ({
  isConnected: false,
  connectionType: "none",
  deviceName: null,
  baudRate: 9600,
  isConnecting: false,
  error: null,

  setBaudRate: (baudRate: number) => set({ baudRate }),

  connectSerial: async (baudRateOverride?: number) => {
    if (typeof window === "undefined" || !("serial" in navigator) || !navigator.serial) {
      set({ error: "Web Serial API tidak didukung di browser ini. Harap gunakan Google Chrome atau Microsoft Edge." });
      return false;
    }

    const baudRate = baudRateOverride || get().baudRate;

    set({ isConnecting: true, error: null });

    try {
      // Prompt user to select port
      const port = await navigator.serial.requestPort();
      await port.open({
        baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
      });

      activeSerialPort = port;
      activeUsbDevice = null;
      activeUsbEndpoint = null;

      const info = port.getInfo();
      const name = info.usbVendorId
        ? `Serial Port (VID: 0x${info.usbVendorId.toString(16).padStart(4, "0")}, PID: 0x${info.usbProductId?.toString(16).padStart(4, "0")})`
        : "Epson LX-310 (Serial)";

      set({
        isConnected: true,
        connectionType: "serial",
        deviceName: name,
        baudRate,
        isConnecting: false,
        error: null,
      });

      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Gagal menghubungkan printer Serial";
      // Ignore user aborting prompt
      const isAbort = errorMessage.includes("No port selected") || errorMessage.includes("user gesture");
      set({
        isConnecting: false,
        error: isAbort ? null : errorMessage,
      });
      return false;
    }
  },

  connectUsb: async () => {
    if (typeof window === "undefined" || !("usb" in navigator) || !navigator.usb) {
      set({ error: "Web USB API tidak didukung di browser ini. Harap gunakan Google Chrome atau Microsoft Edge." });
      return false;
    }

    set({ isConnecting: true, error: null });

    try {
      const device = await navigator.usb.requestDevice({ filters: [] });
      await device.open();

      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      // Find printer class (0x07) interface or default interface 0
      let targetInterfaceNumber = 0;
      if (device.configuration?.interfaces && device.configuration.interfaces.length > 0) {
        const printerIface = device.configuration.interfaces.find((iface) =>
          iface.alternates.some((alt) => alt.interfaceClass === 7)
        );
        if (printerIface) {
          targetInterfaceNumber = printerIface.interfaceNumber;
        }
      }

      await device.claimInterface(targetInterfaceNumber);

      const targetAlt = device.configuration?.interfaces.find(
        (i) => i.interfaceNumber === targetInterfaceNumber
      )?.alternates[0];

      const outEndpoint = targetAlt?.endpoints.find((e) => e.direction === "out");
      if (!outEndpoint) {
        throw new Error("Endpoint Output (transfer out) tidak ditemukan pada perangkat USB.");
      }

      activeUsbDevice = device;
      activeUsbEndpoint = outEndpoint.endpointNumber;
      activeSerialPort = null;

      const name = device.productName || `USB Printer (VID: 0x${device.vendorId.toString(16)})`;

      set({
        isConnected: true,
        connectionType: "usb",
        deviceName: name,
        isConnecting: false,
        error: null,
      });

      return true;
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : "Gagal menghubungkan printer USB";
      const isAbort = rawMessage.includes("No device selected") || rawMessage.includes("user gesture");

      let userFriendlyError = rawMessage;
      if (
        rawMessage.includes("open") ||
        rawMessage.includes("Access denied") ||
        rawMessage.includes("protected") ||
        rawMessage.includes("claimInterface") ||
        rawMessage.includes("in use")
      ) {
        userFriendlyError =
          "Perangkat USB sedang terkunci oleh driver sistem OS (CUPS/Print Spooler). Silakan gunakan tombol 'Hubungkan Web Serial API' di atas untuk terhubung ke port USB printer.";
      }

      set({
        isConnecting: false,
        error: isAbort ? null : userFriendlyError,
      });
      return false;
    }
  },

  disconnect: async () => {
    set({ isConnecting: true });

    if (activeSerialPort) {
      try {
        await activeSerialPort.close();
      } catch (err) {
        console.warn("Error closing serial port:", err);
      }
      activeSerialPort = null;
    }

    if (activeUsbDevice) {
      try {
        await activeUsbDevice.close();
      } catch (err) {
        console.warn("Error closing USB device:", err);
      }
      activeUsbDevice = null;
      activeUsbEndpoint = null;
    }

    set({
      isConnected: false,
      connectionType: "none",
      deviceName: null,
      isConnecting: false,
      error: null,
    });
  },

  sendRawData: async (data: Uint8Array) => {
    const { isConnected, connectionType } = get();

    if (!isConnected) {
      set({ error: "Printer tidak terhubung" });
      return false;
    }

    try {
      if (connectionType === "serial" && activeSerialPort) {
        if (!activeSerialPort.writable) {
          throw new Error("Port Serial tidak siap untuk menulis data.");
        }
        const writer = activeSerialPort.writable.getWriter();
        await writer.write(data);
        writer.releaseLock();
        return true;
      }

      if (connectionType === "usb" && activeUsbDevice && activeUsbEndpoint !== null) {
        const result = await activeUsbDevice.transferOut(activeUsbEndpoint, data.buffer as ArrayBuffer);
        if (result.status !== "ok") {
          throw new Error(`Transfer USB gagal dengan status: ${result.status}`);
        }
        return true;
      }

      throw new Error("Koneksi printer tidak aktif.");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Gagal mengirim data ke printer";
      set({ error: errorMessage });
      return false;
    }
  },

  testPrint: async () => {
    // Standard ESC/P Test Print Payload for Epson LX-310
    const encoder = new TextEncoder();
    const initCmd = new Uint8Array([
      0x1b, 0x40, // ESC @ Reset
      0x1b, 0x78, 0x00, // ESC x 0 Draft Mode
      0x1b, 0x50, // ESC P 10 CPI
      0x1b, 0x45, // ESC E Bold On
    ]);
    const boldOff = new Uint8Array([0x1b, 0x46]); // ESC F Bold Off
    const formFeed = new Uint8Array([0x0c]); // FF Form Feed

    const textBody = encoder.encode(
      "--------------------------------------------------------------------\n" +
      "          TES CETAK PRINTER CONTINUOUS FORM EPSON LX-310           \n" +
      "--------------------------------------------------------------------\n" +
      "Status      : PRINTER TERHUBUNG DAN SIAP DIGUNAKAN\n" +
      "Waktu Tes   : " + new Date().toLocaleString("id-ID") + "\n" +
      "Koneksi     : Web Serial / Web USB Direct Command\n" +
      "--------------------------------------------------------------------\n\n"
    );

    const payload = new Uint8Array(
      initCmd.length + textBody.length + boldOff.length + formFeed.length
    );
    let offset = 0;
    payload.set(initCmd, offset); offset += initCmd.length;
    payload.set(textBody, offset); offset += textBody.length;
    payload.set(boldOff, offset); offset += boldOff.length;
    payload.set(formFeed, offset);

    return await get().sendRawData(payload);
  },

  checkAutoConnect: async () => {
    if (typeof window === "undefined" || !("serial" in navigator) || !navigator.serial) {
      return;
    }

    try {
      const ports = await navigator.serial.getPorts();
      if (ports.length > 0 && !get().isConnected) {
        const port = ports[0];
        await port.open({
          baudRate: get().baudRate,
          dataBits: 8,
          stopBits: 1,
          parity: "none",
        });

        activeSerialPort = port;
        const info = port.getInfo();
        const name = info.usbVendorId
          ? `Serial Port (VID: 0x${info.usbVendorId.toString(16).padStart(4, "0")}, PID: 0x${info.usbProductId?.toString(16).padStart(4, "0")})`
          : "Epson LX-310 (Serial Auto-Connected)";

        set({
          isConnected: true,
          connectionType: "serial",
          deviceName: name,
        });
      }
    } catch {
      // Auto reconnect silent failure is expected if port is busy or unavailable
    }
  },
}));
