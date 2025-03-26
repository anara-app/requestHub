import {
  Checkbox,
  createTheme,
  MultiSelect,
  Select,
  Textarea,
  TextInput,
} from "@mantine/core";
import { DatePickerInput, DateTimePicker } from "@mantine/dates";

export const theme = createTheme({
  colors: {
    primary: [
      "rgba(18, 45, 161, 1)",
      "rgba(18, 45, 161, 1)",
      "rgba(18, 45, 161, 1)",
      "rgba(18, 45, 161, 1)",
      "rgba(18, 45, 161, 1)",
      "rgba(18, 45, 161, 1)",
      "rgba(18, 45, 161, 1)",
      "rgba(18, 45, 161, 1)",
      "rgba(18, 45, 161, 1)",
      "rgba(18, 45, 161, 1)",
    ],
  },

  components: {
    Select: Select.extend({
      styles: {
        label: {
          fontSize: 16,
        },
      },
    }),

    TextInput: TextInput.extend({
      styles: {
        label: {
          fontSize: 16,
        },
      },
    }),

    Textarea: Textarea.extend({
      styles: {
        label: {
          fontSize: 16,
        },
      },
    }),

    MultiSelect: MultiSelect.extend({
      styles: {
        label: {
          fontSize: 16,
        },
      },
    }),

    Checkbox: Checkbox.extend({
      styles: {
        label: {
          fontSize: 16,
        },
      },
    }),

    DatePickerInput: DatePickerInput.extend({
      styles: {
        label: {
          fontSize: 16,
        },
      },
    }),

    DateTimePicker: DateTimePicker.extend({
      styles: {
        label: {
          fontSize: 16,
        },
      },
    }),
  },
});
