import { fireEvent, render } from "@testing-library/react-native";
import { Card, PrimaryButton } from "../components";

describe("native components", () => {
  it("does not call PrimaryButton onPress when disabled", () => {
    const onPress = jest.fn();
    const { getByRole } = render(<PrimaryButton label="Continuar" onPress={onPress} disabled />);

    fireEvent.press(getByRole("button"));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("calls Card onPress", () => {
    const onPress = jest.fn();
    const { getByRole } = render(<Card title="Reunión" onPress={onPress} />);

    fireEvent.press(getByRole("button"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
