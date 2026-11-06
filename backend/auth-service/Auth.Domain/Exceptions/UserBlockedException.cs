using System;
using System.Collections.Generic;
using System.Text;

namespace Auth.Domain.Exceptions
{
    public class UserBlockedException(string message) : Exception(message)
    {
    }
}
