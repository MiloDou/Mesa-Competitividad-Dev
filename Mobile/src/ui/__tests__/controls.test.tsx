import { fireEvent, render } from "@testing-library/react-native";
import { Modal } from "react-native";
import {
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  PrimaryButton,
} from "../../native/components";

describe("shared native controls", () => {
  it("exposes a loading PrimaryButton as named, disabled, and busy without pressing", () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <PrimaryButton label="Guardar cambios" accessibilityLabel="Guardando cambios" loading onPress={onPress} />,
    );
    const button = getByRole("button", { name: "Guardando cambios" });

    expect(button.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true, busy: true }));
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("exposes loading feedback as a busy progressbar", () => {
    const { getByRole } = render(<LoadingState title="Cargando reuniones" />);

    expect(getByRole("progressbar", { name: "Cargando reuniones" }).props.accessibilityState)
      .toEqual(expect.objectContaining({ busy: true }));
  });

  it("keeps the empty-state message available to users", () => {
    const { getByText } = render(<EmptyState title="Sin reuniones" detail="Vuelve más tarde." />);

    expect(getByText("Sin reuniones")).toBeTruthy();
    expect(getByText("Vuelve más tarde.")).toBeTruthy();
  });

  it("exposes errors as alerts and invokes retry once", () => {
    const onRetry = jest.fn();
    const { getByRole } = render(<ErrorState title="Falló la carga" onRetry={onRetry} retryLabel="Reintentar carga" />);

    expect(getByRole("alert")).toBeTruthy();
    fireEvent.press(getByRole("button", { name: "Reintentar carga" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("cancels without confirming, then confirms exactly once", () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { getByRole, rerender } = render(
      <ConfirmationDialog visible title="Confirmar acción" confirmLabel="Confirmar" cancelLabel="Cancelar" onConfirm={onConfirm} onCancel={onCancel} />,
    );

    fireEvent.press(getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();

    rerender(
      <ConfirmationDialog visible title="Confirmar acción" confirmLabel="Confirmar" cancelLabel="Cancelar" onConfirm={onConfirm} onCancel={onCancel} />,
    );
    fireEvent.press(getByRole("button", { name: "Confirmar" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("marks both dialog actions disabled and busy while processing", () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { getByRole } = render(
      <ConfirmationDialog visible title="Confirmar acción" confirmLabel="Confirmar" cancelLabel="Cancelar" busy onConfirm={onConfirm} onCancel={onCancel} />,
    );
    const confirm = getByRole("button", { name: "Confirmar" });
    const cancel = getByRole("button", { name: "Cancelar" });

    expect(confirm.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true, busy: true }));
    expect(cancel.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true, busy: true }));
    fireEvent.press(confirm);
    fireEvent.press(cancel);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("cancels the dialog once when Android requests close while not busy", () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { UNSAFE_getByType } = render(
      <ConfirmationDialog visible title="Confirmar acción" onConfirm={onConfirm} onCancel={onCancel} />,
    );
    const modal = UNSAFE_getByType(Modal);

    fireEvent(modal, "requestClose");

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("ignores Android request close while the dialog is busy", () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { UNSAFE_getByType } = render(
      <ConfirmationDialog visible title="Confirmar acción" busy onConfirm={onConfirm} onCancel={onCancel} />,
    );
    const modal = UNSAFE_getByType(Modal);

    fireEvent(modal, "requestClose");

    expect(onCancel).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
