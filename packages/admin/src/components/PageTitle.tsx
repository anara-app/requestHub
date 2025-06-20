import { Title, TitleProps } from "@mantine/core";

interface PageTitleProps extends Omit<TitleProps, 'order'> {
  children: React.ReactNode;
}

export default function PageTitle({ children, ...props }: PageTitleProps) {
  return (
    <Title 
      order={1} 
      size="h1"
      fw={600}
      mb="xl"
      mt="lg"
      {...props}
    >
      {children}
    </Title>
  );
}
