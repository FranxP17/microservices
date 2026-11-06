using System;
using System.Collections.Generic;
using System.Text;

namespace Auth.Domain.Exceptions
{
    public class InvalidParameterException(string message) : Exception(message)
    {
    }
}
